import type { FuelType } from '@/types/entities';
import { litersToTons } from '@/lib/fuelDensity';
import { pctDelta } from '@/lib/seededRandom';
import { KZ_REGION_NAMES } from '@/mocks/seed/regions';
import { FACT_DATES, FACTS_DAYS, FUEL_TYPES, type RegionFuelDailyFact } from '@/mocks/seed/regionFuelFacts.seed';

/**
 * Единый вычислительный слой аналитического дашборда (по замечаниям ПМ, см. PROGRESS.md):
 * все главные показатели, боковая панель тепловой карты и классификатор аномалий считаются
 * из одной фактовой таблицы (`regionFuelFacts.seed.ts`) с учётом текущих глобальных фильтров —
 * это единственный способ честно выполнить требование «фильтры применяются ко всему дашборду».
 */

export interface DashboardFilters {
  dateFrom: string;
  dateTo: string;
  region: string | 'all';
  fuelType: FuelType | 'all';
  residency: 'all' | 'resident' | 'nonresident';
  ownerType: 'all' | 'fl' | 'ul';
}

export const REGION_OPTIONS: string[] = ['all', ...KZ_REGION_NAMES];
export const FUEL_OPTIONS: string[] = ['all', ...FUEL_TYPES];

/**
 * Упрощение (см. OPEN_QUESTIONS.md): в фактовой таблице нет реального разреза ФЛ/ЮЛ на
 * грануле регион×марка×день (в отличие от резидент/нерезидент, который есть по-настоящему) —
 * фильтр «тип держателя» применяется как единый глобальный коэффициент, а не по-региональный.
 */
const FL_SHARE_GLOBAL = 0.78;

export const DEFAULT_FILTERS: DashboardFilters = {
  dateFrom: FACT_DATES[FACTS_DAYS - 30],
  dateTo: FACT_DATES[FACTS_DAYS - 1],
  region: 'all',
  fuelType: 'all',
  residency: 'all',
  ownerType: 'all',
};

function filterByDateRegionFuel(facts: RegionFuelDailyFact[], filters: DashboardFilters): RegionFuelDailyFact[] {
  return facts.filter(
    (r) =>
      r.date >= filters.dateFrom &&
      r.date <= filters.dateTo &&
      (filters.region === 'all' || r.region === filters.region) &&
      (filters.fuelType === 'all' || r.fuelType === filters.fuelType),
  );
}

/**
 * Объём и нерезидентский объём строки ПОСЛЕ фильтра резидентства — считается явно (не общим
 * коэффициентом на числитель и знаменатель), иначе доля нерезидентов в проценте всегда
 * оставалась бы неизменной при любом значении этого фильтра (числитель/знаменатель сокращались
 * бы одним и тем же множителем). При «резиденты» — нерезидентского объёма в выборке нет вообще
 * (0), при «нерезиденты» — весь отобранный объём является нерезидентским (100%).
 */
function residencySelection(row: RegionFuelDailyFact, filters: DashboardFilters): { volumeL: number; nonresidentVolumeL: number } {
  if (filters.residency === 'resident') return { volumeL: row.volumeL - row.nonresidentVolumeL, nonresidentVolumeL: 0 };
  if (filters.residency === 'nonresident') return { volumeL: row.nonresidentVolumeL, nonresidentVolumeL: row.nonresidentVolumeL };
  return { volumeL: row.volumeL, nonresidentVolumeL: row.nonresidentVolumeL };
}

/** Упрощённый глобальный коэффициент типа держателя (см. допущение выше) — независим от резидентства. */
function ownerTypeRatio(filters: DashboardFilters): number {
  if (filters.ownerType === 'fl') return FL_SHARE_GLOBAL;
  if (filters.ownerType === 'ul') return 1 - FL_SHARE_GLOBAL;
  return 1;
}

export interface ScaledTotals {
  volumeT: number;
  volumeL: number;
  nonresidentVolumeT: number;
  nonresidentVolumeL: number;
  marketVolumeT: number;
  marketVolumeL: number;
  purchaseVolumeT: number;
  purchaseVolumeL: number;
  opsCount: number;
  overLimitOpsCount: number;
}

function emptyTotals(): ScaledTotals {
  return { volumeT: 0, volumeL: 0, nonresidentVolumeT: 0, nonresidentVolumeL: 0, marketVolumeT: 0, marketVolumeL: 0, purchaseVolumeT: 0, purchaseVolumeL: 0, opsCount: 0, overLimitOpsCount: 0 };
}

/** Суммирует строки в тоннах (плотность берётся по марке КАЖДОЙ строки, а не усреднённо) с учётом фильтров резидентства/держателя. */
function sumScaled(rows: RegionFuelDailyFact[], filters: DashboardFilters): ScaledTotals {
  const acc = emptyTotals();
  const ownerRatio = ownerTypeRatio(filters);
  for (const row of rows) {
    const sel = residencySelection(row, filters);
    // market/purchase/opsCount не имеют собственного разреза по резидентству в фактовой таблице —
    // масштабируются пропорционально доле объёма, оставшейся после фильтра резидентства (допущение).
    const residencyVolumeRatio = row.volumeL > 0 ? sel.volumeL / row.volumeL : 0;
    const proportionalFactor = residencyVolumeRatio * ownerRatio;

    const vL = sel.volumeL * ownerRatio;
    const nrL = sel.nonresidentVolumeL * ownerRatio;
    const mL = row.marketVolumeL * proportionalFactor;
    const pL = row.purchaseVolumeL * proportionalFactor;
    acc.volumeL += vL;
    acc.volumeT += litersToTons(vL, row.fuelType);
    acc.nonresidentVolumeL += nrL;
    acc.nonresidentVolumeT += litersToTons(nrL, row.fuelType);
    acc.marketVolumeL += mL;
    acc.marketVolumeT += litersToTons(mL, row.fuelType);
    acc.purchaseVolumeL += pL;
    acc.purchaseVolumeT += litersToTons(pL, row.fuelType);
    acc.opsCount += row.opsCount * proportionalFactor;
    acc.overLimitOpsCount += row.overLimitOpsCount * proportionalFactor;
  }
  return acc;
}

function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  return new Date(d.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Предыдущий период той же длины, вплотную примыкающий к текущему — для дельты «к прошлому периоду». */
export function previousPeriodRange(dateFrom: string, dateTo: string): { dateFrom: string; dateTo: string } {
  const spanDays = Math.round((new Date(`${dateTo}T00:00:00.000Z`).getTime() - new Date(`${dateFrom}T00:00:00.000Z`).getTime()) / 86_400_000) + 1;
  return { dateFrom: addDaysISO(dateFrom, -spanDays), dateTo: addDaysISO(dateFrom, -1) };
}

// ---------------------------------------------------------------------------
// Главный показатель №1 — объём реализации в разрезе марок топлива, тонны
// ---------------------------------------------------------------------------

export interface FuelVolumeBreakdownItem {
  fuelType: FuelType;
  volumeT: number;
  volumeL: number;
  deltaPct: number;
}

export function computeFuelBreakdown(facts: RegionFuelDailyFact[], filters: DashboardFilters): FuelVolumeBreakdownItem[] {
  const currentRows = filterByDateRegionFuel(facts, filters);
  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevRows = filterByDateRegionFuel(facts, { ...filters, ...prevRange });

  const fuelsInScope = filters.fuelType === 'all' ? FUEL_TYPES : [filters.fuelType];
  return fuelsInScope.map((fuelType) => {
    const cur = sumScaled(currentRows.filter((r) => r.fuelType === fuelType), filters);
    const prev = sumScaled(prevRows.filter((r) => r.fuelType === fuelType), filters);
    return { fuelType, volumeT: cur.volumeT, volumeL: cur.volumeL, deltaPct: pctDelta(cur.volumeT, prev.volumeT) };
  });
}

// ---------------------------------------------------------------------------
// Главный показатель №2 — «Сверка с СУНП»: закуп vs факт, тонны + %
// ---------------------------------------------------------------------------

export interface SunpWeeklyPoint {
  label: string;
  purchaseT: number;
  realizedT: number;
}

export interface SunpReconciliation {
  purchaseT: number;
  purchaseL: number;
  realizedT: number;
  realizedL: number;
  ratioPct: number;
  deltaPct: number;
  weeklyTrend: SunpWeeklyPoint[];
}

export function computeSunpReconciliation(facts: RegionFuelDailyFact[], filters: DashboardFilters): SunpReconciliation {
  const currentRows = filterByDateRegionFuel(facts, filters);
  const cur = sumScaled(currentRows, filters);
  const ratioPct = cur.purchaseVolumeT > 0 ? Math.round((cur.volumeT / cur.purchaseVolumeT) * 1000) / 10 : 0;

  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevRows = filterByDateRegionFuel(facts, { ...filters, ...prevRange });
  const prev = sumScaled(prevRows, filters);
  const prevRatioPct = prev.purchaseVolumeT > 0 ? (prev.volumeT / prev.purchaseVolumeT) * 100 : 0;

  const weeklyTrend: SunpWeeklyPoint[] = [];
  let cursor = filters.dateFrom;
  let weekIndex = 1;
  while (cursor <= filters.dateTo) {
    const weekEnd = addDaysISO(cursor, 6) > filters.dateTo ? filters.dateTo : addDaysISO(cursor, 6);
    const weekRows = currentRows.filter((r) => r.date >= cursor && r.date <= weekEnd);
    const weekTotals = sumScaled(weekRows, filters);
    weeklyTrend.push({ label: `Нед. ${weekIndex}`, purchaseT: Math.round(weekTotals.purchaseVolumeT), realizedT: Math.round(weekTotals.volumeT) });
    cursor = addDaysISO(weekEnd, 1);
    weekIndex += 1;
  }

  return {
    purchaseT: cur.purchaseVolumeT,
    purchaseL: cur.purchaseVolumeL,
    realizedT: cur.volumeT,
    realizedL: cur.volumeL,
    ratioPct,
    deltaPct: pctDelta(ratioPct, prevRatioPct),
    weeklyTrend,
  };
}

// ---------------------------------------------------------------------------
// Главный показатель №3 — доля отпуска нерезидентам, по объёму (не по числу зарегистрированных лиц)
// ---------------------------------------------------------------------------

export interface NonresidentSharePoint {
  label: string;
  sharePct: number;
}

export interface NonresidentShareResult {
  sharePct: number;
  /** Абсолютный объём, отпущенный нерезидентам, тонны — та же цифра, что складывается в sharePct, чтобы % не был «голым». */
  volumeT: number;
  deltaPct: number;
  trend: NonresidentSharePoint[];
}

export function computeNonresidentShare(facts: RegionFuelDailyFact[], filters: DashboardFilters): NonresidentShareResult {
  const currentRows = filterByDateRegionFuel(facts, filters);
  const cur = sumScaled(currentRows, filters);
  const sharePct = cur.volumeT > 0 ? Math.round((cur.nonresidentVolumeT / cur.volumeT) * 1000) / 10 : 0;

  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevRows = filterByDateRegionFuel(facts, { ...filters, ...prevRange });
  const prev = sumScaled(prevRows, filters);
  const prevSharePct = prev.volumeT > 0 ? (prev.nonresidentVolumeT / prev.volumeT) * 100 : 0;

  const trend: NonresidentSharePoint[] = [];
  let cursor = filters.dateFrom;
  let weekIndex = 1;
  while (cursor <= filters.dateTo) {
    const weekEnd = addDaysISO(cursor, 6) > filters.dateTo ? filters.dateTo : addDaysISO(cursor, 6);
    const weekRows = currentRows.filter((r) => r.date >= cursor && r.date <= weekEnd);
    const weekTotals = sumScaled(weekRows, filters);
    trend.push({ label: `Нед. ${weekIndex}`, sharePct: weekTotals.volumeT > 0 ? Math.round((weekTotals.nonresidentVolumeT / weekTotals.volumeT) * 1000) / 10 : 0 });
    cursor = addDaysISO(weekEnd, 1);
    weekIndex += 1;
  }

  return { sharePct, volumeT: cur.nonresidentVolumeT, deltaPct: pctDelta(sharePct, prevSharePct), trend };
}

// ---------------------------------------------------------------------------
// Главный показатель №4 — доля операций сверх суточного лимита (объём и количество)
// ---------------------------------------------------------------------------

export interface OverLimitShareResult {
  volumeSharePct: number;
  /** Абсолютный объём сверх лимита (по рыночной цене), тонны. */
  volumeT: number;
  opsSharePct: number;
  /** Абсолютное количество операций сверх лимита. */
  opsCount: number;
  /** Абсолютное общее количество операций за период (знаменатель opsSharePct). */
  totalOpsCount: number;
  deltaPct: number;
  trend: NonresidentSharePoint[];
}

export function computeOverLimitShare(facts: RegionFuelDailyFact[], filters: DashboardFilters): OverLimitShareResult {
  const currentRows = filterByDateRegionFuel(facts, filters);
  const cur = sumScaled(currentRows, filters);
  const volumeSharePct = cur.volumeT > 0 ? Math.round((cur.marketVolumeT / cur.volumeT) * 1000) / 10 : 0;
  const opsSharePct = cur.opsCount > 0 ? Math.round((cur.overLimitOpsCount / cur.opsCount) * 1000) / 10 : 0;

  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevRows = filterByDateRegionFuel(facts, { ...filters, ...prevRange });
  const prev = sumScaled(prevRows, filters);
  const prevVolumeSharePct = prev.volumeT > 0 ? (prev.marketVolumeT / prev.volumeT) * 100 : 0;

  const trend: NonresidentSharePoint[] = [];
  let cursor = filters.dateFrom;
  let weekIndex = 1;
  while (cursor <= filters.dateTo) {
    const weekEnd = addDaysISO(cursor, 6) > filters.dateTo ? filters.dateTo : addDaysISO(cursor, 6);
    const weekRows = currentRows.filter((r) => r.date >= cursor && r.date <= weekEnd);
    const weekTotals = sumScaled(weekRows, filters);
    trend.push({ label: `Нед. ${weekIndex}`, sharePct: weekTotals.volumeT > 0 ? Math.round((weekTotals.marketVolumeT / weekTotals.volumeT) * 1000) / 10 : 0 });
    cursor = addDaysISO(weekEnd, 1);
    weekIndex += 1;
  }

  return {
    volumeSharePct,
    volumeT: cur.marketVolumeT,
    opsSharePct,
    opsCount: Math.round(cur.overLimitOpsCount),
    totalOpsCount: Math.round(cur.opsCount),
    deltaPct: pctDelta(volumeSharePct, prevVolumeSharePct),
    trend,
  };
}

// ---------------------------------------------------------------------------
// Боковая панель тепловой карты — детали выбранного региона под текущие глобальные фильтры
// ---------------------------------------------------------------------------

export interface RegionTotal {
  region: string;
  volumeT: number;
}

/**
 * Порог «заметного» роста объёма к предыдущему периоду той же длины — не задан явно в исходных
 * материалах, зафиксирован как допущение (см. OPEN_QUESTIONS.md). Это НЕ показатель нарушения:
 * быстрый рост объёма может быть легитимным сезонным спросом (посевная/уборочная кампания и т.п.),
 * поэтому визуально оформляется отдельно от красно-жёлто-зелёного статуса риска (см. shareToneUI.ts).
 */
export const VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT = 25;

/** % изменения объёма региона (тонны) к предыдущему периоду той же длины, под текущими фильтрами. */
function regionVolumeDeltaPct(facts: RegionFuelDailyFact[], filters: DashboardFilters, region: string): number {
  const regionFilters: DashboardFilters = { ...filters, region };
  const curT = sumScaled(filterByDateRegionFuel(facts, regionFilters), filters).volumeT;
  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevT = sumScaled(filterByDateRegionFuel(facts, { ...regionFilters, ...prevRange }), filters).volumeT;
  return pctDelta(curT, prevT);
}

/**
 * Суммарный объём (тонны) по каждому региону под текущими фильтрами (период/марка/резидентство/
 * держатель, без фильтра по региону) — из той же фактовой таблицы, что и остальные показатели.
 * Раньше «ранг по объёму»/«% от объёма РК» на боковой панели тепловой карты считались от
 * СИНТЕТИЧЕСКОГО `consumptionIndex` в `regionConsumptionSeed` (случайное число, не связанное с
 * реальным объёмом на этой же панели) — отсюда и «откуда этот процент?». Теперь и ранг, и доля
 * от РК считаются из тех же тонн, что показаны в «Объём по маркам» на этой же панели.
 */
export function computeAllRegionTotals(facts: RegionFuelDailyFact[], filters: DashboardFilters): RegionTotal[] {
  return KZ_REGION_NAMES.map((region) => {
    const rows = filterByDateRegionFuel(facts, { ...filters, region });
    const totals = sumScaled(rows, filters);
    return { region, volumeT: totals.volumeT };
  });
}

export interface RegionDetail {
  region: string;
  fuelBreakdown: FuelVolumeBreakdownItem[];
  totalVolumeT: number;
  totalVolumeL: number;
  volumeRank: number;
  totalRegions: number;
  /** Доля объёма этого региона от суммарного объёма всех регионов РК под текущими фильтрами. */
  volumeSharePctOfRK: number;
  /** % изменения объёма к предыдущему периоду той же длины — рост сам по себе не нарушение (см. VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT). */
  volumeDeltaPct: number;
  nonresidentSharePct: number;
  /** Абсолютный объём, отпущенный нерезидентам в этом регионе, тонны. */
  nonresidentVolumeT: number;
  overLimitVolumeSharePct: number;
  /** Абсолютный объём сверх лимита в этом регионе, тонны. */
  overLimitVolumeT: number;
  /** Абсолютное количество операций сверх лимита / общее количество операций в этом регионе. */
  overLimitOpsCount: number;
  overLimitTotalOpsCount: number;
  /**
   * Статус региона — «худший» из двух тонов (доля нерезидентам vs порог 20%, доля сверх лимита
   * vs порог 15%) — те же пороги, что использует классификатор аномалий. Раньше здесь был
   * отдельный `riskScore`/`riskTier` из `regionConsumptionSeed` (случайное число без видимой
   * формулы — источник вопроса «как ты высчитываешь эти баллы?»). Теперь статус прямо и
   * прозрачно выводится из двух процентов, которые показаны на этой же панели.
   */
  status: ShareTone;
}

export function computeRegionDetail(facts: RegionFuelDailyFact[], filters: DashboardFilters, region: string): RegionDetail {
  const regionFilters: DashboardFilters = { ...filters, region };
  const fuelBreakdown = computeFuelBreakdown(facts, regionFilters);
  const totalVolumeT = fuelBreakdown.reduce((s, f) => s + f.volumeT, 0);
  const totalVolumeL = fuelBreakdown.reduce((s, f) => s + f.volumeL, 0);

  const nonresident = computeNonresidentShare(facts, regionFilters);
  const overLimit = computeOverLimitShare(facts, regionFilters);

  const allTotals = computeAllRegionTotals(facts, filters);
  const totalRK = allTotals.reduce((s, r) => s + r.volumeT, 0);
  const sortedByVolume = [...allTotals].sort((a, b) => b.volumeT - a.volumeT);
  const volumeRank = sortedByVolume.findIndex((r) => r.region === region) + 1;
  const volumeSharePctOfRK = totalRK > 0 ? Math.round((totalVolumeT / totalRK) * 1000) / 10 : 0;

  const nonresidentTone = shareTone(nonresident.sharePct, NONRESIDENT_SPIKE_THRESHOLD_PCT / 2, NONRESIDENT_SPIKE_THRESHOLD_PCT);
  const overLimitTone = shareTone(overLimit.volumeSharePct, OVER_LIMIT_SHARE_THRESHOLD_PCT / 2, OVER_LIMIT_SHARE_THRESHOLD_PCT);
  const status: ShareTone = TONE_RANK[nonresidentTone] >= TONE_RANK[overLimitTone] ? nonresidentTone : overLimitTone;

  return {
    region,
    fuelBreakdown,
    totalVolumeT,
    totalVolumeL,
    volumeRank,
    totalRegions: allTotals.length,
    volumeSharePctOfRK,
    volumeDeltaPct: regionVolumeDeltaPct(facts, filters, region),
    nonresidentSharePct: nonresident.sharePct,
    nonresidentVolumeT: nonresident.volumeT,
    overLimitVolumeSharePct: overLimit.volumeSharePct,
    overLimitVolumeT: overLimit.volumeT,
    overLimitOpsCount: overLimit.opsCount,
    overLimitTotalOpsCount: overLimit.totalOpsCount,
    status,
  };
}

// ---------------------------------------------------------------------------
// Классификатор аномалий — 3 категории (заменяет прежние 4, привязанные к очереди кейсов)
// ---------------------------------------------------------------------------

export type DashboardAnomalyCategory = 'fuel_dropoff' | 'nonresident_spike' | 'over_limit_share';

export interface AnomalyClassifierPoint {
  category: DashboardAnomalyCategory;
  label: string;
  description: string;
  currentCount: number;
  priorPeriodCount: number;
}

/**
 * Пороги классификатора — не заданы явно в исходных материалах, зафиксированы как допущение
 * (см. OPEN_QUESTIONS.md). Экспортируются — переиспользуются в `AdminDashboardPage.tsx`/
 * `OverLimitShareCard.tsx` для цветовой индикации (зелёный/жёлтый/красный) тех же двух главных
 * показателей, чтобы пороги «что считать высоким» не расходились между классификатором и KPI.
 */
export const FUEL_DROPOFF_THRESHOLD_PCT = 30;
const FUEL_DROPOFF_MIN_PRIOR_T = 1;
export const NONRESIDENT_SPIKE_THRESHOLD_PCT = 20;
export const OVER_LIMIT_SHARE_THRESHOLD_PCT = 15;

export type ShareTone = 'ok' | 'warning' | 'critical';

/** Классификация доли (%) на «низкий/средний/высокий» по тем же порогам, что и классификатор аномалий — для цветовой индикации KPI-плиток. */
export function shareTone(pct: number, warnAtPct: number, riskAtPct: number): ShareTone {
  if (pct >= riskAtPct) return 'critical';
  if (pct >= warnAtPct) return 'warning';
  return 'ok';
}

const TONE_RANK: Record<ShareTone, number> = { ok: 0, warning: 1, critical: 2 };

// ---------------------------------------------------------------------------
// Сводная таблица по регионам (под тепловой картой) — все регионы одним списком, для сортировки
// ---------------------------------------------------------------------------

export interface RegionSummaryRow {
  region: string;
  volumeT: number;
  volumeL: number;
  /** Место среди регионов РК по объёму (1 — наибольший объём). */
  rank: number;
  volumeSharePctOfRK: number;
  /** % изменения объёма к предыдущему периоду той же длины — рост сам по себе не нарушение (см. VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT). */
  volumeDeltaPct: number;
  nonresidentSharePct: number;
  nonresidentVolumeT: number;
  overLimitSharePct: number;
  overLimitVolumeT: number;
  status: ShareTone;
}

/** Тот же набор показателей, что и `computeRegionDetail`, но сразу для всех регионов одним проходом (для сводной таблицы под картой) — переиспользует `computeAllRegionTotals` один раз, а не по разу на регион. */
export function computeRegionSummaries(facts: RegionFuelDailyFact[], filters: DashboardFilters): RegionSummaryRow[] {
  const allTotals = computeAllRegionTotals(facts, filters);
  const totalRK = allTotals.reduce((s, r) => s + r.volumeT, 0);
  const rankOf = new Map([...allTotals].sort((a, b) => b.volumeT - a.volumeT).map((r, i) => [r.region, i + 1]));

  return allTotals.map(({ region, volumeT }) => {
    const rows = filterByDateRegionFuel(facts, { ...filters, region });
    const totals = sumScaled(rows, filters);
    const nonresidentSharePct = totals.volumeT > 0 ? Math.round((totals.nonresidentVolumeT / totals.volumeT) * 1000) / 10 : 0;
    const overLimitSharePct = totals.volumeT > 0 ? Math.round((totals.marketVolumeT / totals.volumeT) * 1000) / 10 : 0;

    const nonresidentTone = shareTone(nonresidentSharePct, NONRESIDENT_SPIKE_THRESHOLD_PCT / 2, NONRESIDENT_SPIKE_THRESHOLD_PCT);
    const overLimitTone = shareTone(overLimitSharePct, OVER_LIMIT_SHARE_THRESHOLD_PCT / 2, OVER_LIMIT_SHARE_THRESHOLD_PCT);
    const status: ShareTone = TONE_RANK[nonresidentTone] >= TONE_RANK[overLimitTone] ? nonresidentTone : overLimitTone;

    return {
      region,
      volumeT,
      volumeL: totals.volumeL,
      rank: rankOf.get(region) ?? 0,
      volumeSharePctOfRK: totalRK > 0 ? Math.round((volumeT / totalRK) * 1000) / 10 : 0,
      volumeDeltaPct: regionVolumeDeltaPct(facts, filters, region),
      nonresidentSharePct,
      nonresidentVolumeT: totals.nonresidentVolumeT,
      overLimitSharePct,
      overLimitVolumeT: totals.marketVolumeT,
      status,
    };
  });
}

function countFuelDropoffs(facts: RegionFuelDailyFact[], filters: DashboardFilters): number {
  const currentRows = filterByDateRegionFuel(facts, filters);
  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevRows = filterByDateRegionFuel(facts, { ...filters, ...prevRange });

  const regions = filters.region === 'all' ? KZ_REGION_NAMES : [filters.region];
  const fuels = filters.fuelType === 'all' ? FUEL_TYPES : [filters.fuelType];

  let flagged = 0;
  for (const region of regions) {
    for (const fuelType of fuels) {
      const curT = sumScaled(currentRows.filter((r) => r.region === region && r.fuelType === fuelType), filters).volumeT;
      const priorT = sumScaled(prevRows.filter((r) => r.region === region && r.fuelType === fuelType), filters).volumeT;
      if (priorT >= FUEL_DROPOFF_MIN_PRIOR_T && curT <= priorT * (1 - FUEL_DROPOFF_THRESHOLD_PCT / 100)) flagged += 1;
    }
  }
  return flagged;
}

function countNonresidentSpikes(facts: RegionFuelDailyFact[], filters: DashboardFilters): number {
  const rows = filterByDateRegionFuel(facts, filters);
  const regions = filters.region === 'all' ? KZ_REGION_NAMES : [filters.region];
  let flagged = 0;
  for (const region of regions) {
    const totals = sumScaled(rows.filter((r) => r.region === region), filters);
    const sharePct = totals.volumeT > 0 ? (totals.nonresidentVolumeT / totals.volumeT) * 100 : 0;
    if (sharePct >= NONRESIDENT_SPIKE_THRESHOLD_PCT) flagged += 1;
  }
  return flagged;
}

function countOverLimitRegions(facts: RegionFuelDailyFact[], filters: DashboardFilters): number {
  const rows = filterByDateRegionFuel(facts, filters);
  const regions = filters.region === 'all' ? KZ_REGION_NAMES : [filters.region];
  let flagged = 0;
  for (const region of regions) {
    const totals = sumScaled(rows.filter((r) => r.region === region), filters);
    const sharePct = totals.volumeT > 0 ? (totals.marketVolumeT / totals.volumeT) * 100 : 0;
    if (sharePct >= OVER_LIMIT_SHARE_THRESHOLD_PCT) flagged += 1;
  }
  return flagged;
}

export function computeAnomalyClassifier(facts: RegionFuelDailyFact[], filters: DashboardFilters): AnomalyClassifierPoint[] {
  const prevRange = previousPeriodRange(filters.dateFrom, filters.dateTo);
  const prevFilters: DashboardFilters = { ...filters, ...prevRange };

  return [
    {
      category: 'fuel_dropoff',
      label: 'Резкий отток марки топлива в регионе',
      description: `Объём марки топлива в регионе за период упал на ${FUEL_DROPOFF_THRESHOLD_PCT}%+ к среднему за предыдущий период`,
      currentCount: countFuelDropoffs(facts, filters),
      priorPeriodCount: countFuelDropoffs(facts, prevFilters),
    },
    {
      category: 'nonresident_spike',
      label: 'Аномально высокая доля отпуска нерезидентам',
      description: `Регион, где доля нерезидентов в объёме отпуска ≥ ${NONRESIDENT_SPIKE_THRESHOLD_PCT}%`,
      currentCount: countNonresidentSpikes(facts, filters),
      priorPeriodCount: countNonresidentSpikes(facts, prevFilters),
    },
    {
      category: 'over_limit_share',
      label: 'Повышенная доля операций сверх лимита',
      description: `Регион, где доля объёма по рыночной цене (сверх суточного лимита) ≥ ${OVER_LIMIT_SHARE_THRESHOLD_PCT}%`,
      currentCount: countOverLimitRegions(facts, filters),
      priorPeriodCount: countOverLimitRegions(facts, prevFilters),
    },
  ];
}
