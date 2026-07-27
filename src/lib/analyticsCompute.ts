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
  realizedT: number;
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

  return { purchaseT: cur.purchaseVolumeT, realizedT: cur.volumeT, ratioPct, deltaPct: pctDelta(ratioPct, prevRatioPct), weeklyTrend };
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

  return { sharePct, deltaPct: pctDelta(sharePct, prevSharePct), trend };
}

// ---------------------------------------------------------------------------
// Главный показатель №4 — доля операций сверх суточного лимита (объём и количество)
// ---------------------------------------------------------------------------

export interface OverLimitShareResult {
  volumeSharePct: number;
  opsSharePct: number;
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

  return { volumeSharePct, opsSharePct, deltaPct: pctDelta(volumeSharePct, prevVolumeSharePct), trend };
}

// ---------------------------------------------------------------------------
// Боковая панель тепловой карты — детали выбранного региона под текущие глобальные фильтры
// ---------------------------------------------------------------------------

export interface RegionDetail {
  region: string;
  fuelBreakdown: FuelVolumeBreakdownItem[];
  nonresidentSharePct: number;
  overLimitVolumeSharePct: number;
}

export function computeRegionDetail(facts: RegionFuelDailyFact[], filters: DashboardFilters, region: string): RegionDetail {
  const regionFilters: DashboardFilters = { ...filters, region };
  const fuelBreakdown = computeFuelBreakdown(facts, regionFilters);
  const nonresident = computeNonresidentShare(facts, regionFilters);
  const overLimit = computeOverLimitShare(facts, regionFilters);
  return { region, fuelBreakdown, nonresidentSharePct: nonresident.sharePct, overLimitVolumeSharePct: overLimit.volumeSharePct };
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

/** Пороги классификатора — не заданы явно в исходных материалах, зафиксированы как допущение (см. OPEN_QUESTIONS.md). */
const FUEL_DROPOFF_THRESHOLD_PCT = 30;
const FUEL_DROPOFF_MIN_PRIOR_T = 1;
const NONRESIDENT_SPIKE_THRESHOLD_PCT = 20;
const OVER_LIMIT_SHARE_THRESHOLD_PCT = 15;

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
