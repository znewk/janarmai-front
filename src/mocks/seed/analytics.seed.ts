import type { AnomalyType } from '@/types/entities';
import { mulberry32, randInt, randRange } from '@/lib/seededRandom';
import { riskTierOf, ANOMALY_TYPE_LABEL, ANOMALY_TYPE_DESCRIPTION } from '@/lib/riskTier';
import { casesSeed } from './cases.seed';
import { PRICE_KZT } from './limits.seed';

/**
 * Сгенерированные наборы данных для аналитического модуля (ТЗ раздел 6, 8.5 + дополнение
 * `JanarmAI_Analytics_Deep_Dive.docx`, разд. 5): значения детерминированы seeded-PRNG
 * (`mulberry32`, не «голый» `Math.random()` — числа не должны дрейфовать между перезапусками),
 * но при этом намеренно НЕ круглые и содержат сезонность + минимум один выброс на каждый ряд —
 * по прямому требованию дополнения («никаких круглых чисел... данные шумные, с неровными хвостами»).
 *
 * Границы регионов для тепловой карты (src/mocks/geo/kz-oblasts.json, 20 регионов, актуализация 2024 г.):
 * geokz (github.com/arodionoff/geokz, CC BY 4.0), на основе UN OCHA COD-AB Kazakhstan.
 */

const MONTH_LABELS = ['Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл'];

// ---------------------------------------------------------------------------
// Помесячная сверка «Закуп по СНТ vs Фактические продажи» (A-02) — с шумом и выбросом
// ---------------------------------------------------------------------------

export interface MonthlyLegalityPoint {
  month: string;
  sntVolumeMlnL: number;
  salesVolumeMlnL: number;
  legalityIndexPct: number;
}

const monthlyRng = mulberry32(7101);
/** Индекс месяца с намеренным провалом легальности (зимний всплеск нелегального оборота) — «хотя бы один выброс за период». */
const LEGALITY_ANOMALY_MONTH_INDEX = 4; // «Дек»

export const monthlyLegalitySeed: MonthlyLegalityPoint[] = MONTH_LABELS.map((month, i) => {
  const seasonal = 55 + 12 * Math.sin(((i + 10) / 12) * Math.PI * 2); // пик к середине лета
  const noise = randRange(monthlyRng, -2.4, 2.4);
  const sntVolumeMlnL = Math.round((seasonal + noise) * 100) / 100;
  let legalityIndexPct = 78 + (94 - 78) * (i / (MONTH_LABELS.length - 1)) + randRange(monthlyRng, -1.1, 1.1);
  if (i === LEGALITY_ANOMALY_MONTH_INDEX) legalityIndexPct -= 9.4; // выброс — сезонный провал в декабре
  legalityIndexPct = Math.round(Math.min(99, Math.max(60, legalityIndexPct)) * 10) / 10;
  const salesVolumeMlnL = Math.round(((sntVolumeMlnL * legalityIndexPct) / 100) * 100) / 100;
  return { month, sntVolumeMlnL, salesVolumeMlnL, legalityIndexPct };
});

// ---------------------------------------------------------------------------
// Разложение разрыва «закуп vs факт» по топ-5 контрагентам (Deep Dive 4.2, по аналогии с Кенией)
// ---------------------------------------------------------------------------

export interface GapCounterparty {
  name: string;
  gapVolumeL: number;
  gapSharePct: number;
}

const gapRng = mulberry32(4402);
const GAP_COUNTERPARTIES = ['КМГ АЗС', 'Sinooil', 'Гелиос', 'ТОО «НефтеТрейд Империал»', 'ИП Байсеитов А.М.'];

const totalGapMlnL = monthlyLegalitySeed.reduce((sum, m) => sum + (m.sntVolumeMlnL - m.salesVolumeMlnL), 0);
const totalGapL = Math.round(totalGapMlnL * 1_000_000);

/** Долгий хвост, не равномерное деление — один контрагент даёт заметно больше остальных (типичная картина в реальных аудитах). */
const rawGapWeights = GAP_COUNTERPARTIES.map((_, i) => (i === 0 ? randRange(gapRng, 32, 41) : randRange(gapRng, 6, 22)));
const gapWeightSum = rawGapWeights.reduce((a, b) => a + b, 0);

export const legalityGapByCounterpartySeed: GapCounterparty[] = GAP_COUNTERPARTIES.map((name, i) => {
  const gapSharePct = Math.round((rawGapWeights[i] / gapWeightSum) * 1000) / 10;
  return { name, gapSharePct, gapVolumeL: Math.round((totalGapL * rawGapWeights[i]) / gapWeightSum) };
}).sort((a, b) => b.gapSharePct - a.gapSharePct);

// ---------------------------------------------------------------------------
// Рейтинг сетей АЗС (A-03) — авторизации vs чеки ОФД + риск-балл по сети
// ---------------------------------------------------------------------------

export interface StationNetworkStat {
  network: string;
  janarmaiAuthorizations: number;
  ofdReceipts: number;
  riskScore: number;
}

const networkRng = mulberry32(9931);
export const stationNetworkStatsSeed: StationNetworkStat[] = [
  { network: 'КМГ АЗС', janarmaiAuthorizations: 182_437, ofdReceipts: 183_082 },
  { network: 'Sinooil', janarmaiAuthorizations: 94_716, ofdReceipts: 97_204 },
  { network: 'Гелиос', janarmaiAuthorizations: 61_289, ofdReceipts: 79_913 },
].map((n) => {
  const gapRatio = (n.ofdReceipts - n.janarmaiAuthorizations) / n.janarmaiAuthorizations;
  const riskScore = Math.round(Math.min(96, Math.max(8, gapRatio * 480 + randRange(networkRng, -4, 4))));
  return { ...n, riskScore };
}).sort((a, b) => b.riskScore - a.riskScore);

// ---------------------------------------------------------------------------
// Структура потребления резиденты/нерезиденты (A-05) — помесячно, с ростом доли нерезидентов
// ---------------------------------------------------------------------------

export interface ConsumptionStructurePoint {
  month: string;
  residentSharePct: number;
  nonresidentSharePct: number;
}

const structureRng = mulberry32(5511);
export const consumptionStructureSeed: ConsumptionStructurePoint[] = MONTH_LABELS.map((month, i) => {
  const trend = 6 + 5 * (i / (MONTH_LABELS.length - 1));
  const noise = randRange(structureRng, -0.6, 0.6);
  const nonresidentSharePct = Math.round((trend + noise) * 10) / 10;
  return { month, nonresidentSharePct, residentSharePct: Math.round((100 - nonresidentSharePct) * 10) / 10 };
});

// ---------------------------------------------------------------------------
// Регионы РК — потребление, риск-тир, доля нерезидентов (A-04, тепловая карта по severity)
// ---------------------------------------------------------------------------

export interface RegionConsumptionPoint {
  name: string;
  consumptionIndex: number;
  isBorderRegion: boolean;
  riskScore: number;
  riskTier: 'high' | 'medium' | 'low';
  nonresidentSharePct: number;
}

/**
 * Регионы РК, граничащие с РФ (актуальное деление 2024 г., 20 регионов — см. src/mocks/geo/kz-oblasts.json).
 * Абайская область выделена в 2022 г. из Восточно-Казахстанской и сохраняет северный участок границы с РФ.
 */
const BORDER_REGIONS = new Set([
  'Западно-Казахстанская',
  'Костанайская',
  'Северо-Казахстанская',
  'Павлодарская',
  'Актюбинская',
  'Восточно-Казахстанская',
  'Атырауская',
  'Абайская',
]);

/** 3 приграничные области с заметно повышенным риском/долей нерезидентов — маршруты вывоза к границе РФ (Deep Dide 5). */
const ELEVATED_RISK_BORDER_REGIONS = new Set(['Атырауская', 'Западно-Казахстанская', 'Актюбинская']);

/** Индекс потребления по всем 20 регионам актуального деления (совпадает 1:1 с именами в kz-oblasts.json). */
const REGION_BASE_CONSUMPTION: Record<string, number> = {
  'Алматинская': 82,
  'Акмолинская': 58,
  'Актюбинская': 47,
  'Атырауская': 44,
  'Восточно-Казахстанская': 61,
  'Мангистауская': 33,
  'Северо-Казахстанская': 39,
  'Павлодарская': 45,
  'Карагандинская': 68,
  'Костанайская': 51,
  'Кызылординская': 29,
  'Туркестанская': 73,
  'Западно-Казахстанская': 42,
  'Жамбылская': 55,
  'Абайская': 40,
  'Жетысуская': 46,
  'Улытауская': 24,
  'Астана': 95,
  'Алматы': 98,
  'Шымкент': 70,
};

const regionRng = mulberry32(2201);

export const regionConsumptionSeed: RegionConsumptionPoint[] = Object.entries(REGION_BASE_CONSUMPTION).map(([name, consumptionIndex]) => {
  const isBorderRegion = BORDER_REGIONS.has(name);
  const isElevated = ELEVATED_RISK_BORDER_REGIONS.has(name);
  let riskScore = isBorderRegion ? randRange(regionRng, 56, 79) : randRange(regionRng, 9, 52);
  if (isElevated) riskScore = randRange(regionRng, 81, 94);
  riskScore = Math.round(riskScore);

  let nonresidentSharePct = isBorderRegion ? randRange(regionRng, 12, 22) : randRange(regionRng, 0.8, 4.5);
  if (isElevated) nonresidentSharePct = randRange(regionRng, 26, 37);
  nonresidentSharePct = Math.round(nonresidentSharePct * 10) / 10;

  return { name, consumptionIndex, isBorderRegion, riskScore, riskTier: riskTierOf(riskScore), nonresidentSharePct };
});

export interface FuelTourismGroup {
  group: string;
  nonresidentSharePct: number;
}

/** Индекс топливного туризма — доля отпуска нерезидентам в приграничных областях vs внутренние регионы. */
export const fuelTourismSeed: FuelTourismGroup[] = [
  { group: 'Приграничные области', nonresidentSharePct: 21.4 },
  { group: 'Внутренние регионы', nonresidentSharePct: 3.8 },
];

// ---------------------------------------------------------------------------
// Таксономия аномалий (A-06) — заменяет бинарный статус «Легально/Блокировка» (SGS, Deep Dive 2.1/4.2)
// ---------------------------------------------------------------------------

export interface AnomalyTaxonomyPoint {
  type: AnomalyType;
  label: string;
  description: string;
  currentCount: number;
  priorPeriodCount: number;
}

const taxonomyRng = mulberry32(6603);
const ANOMALY_TYPES: AnomalyType[] = ['export_smuggling', 'limit_exceeded', 'frequent_shuttle', 'technical_failure'];

/** Счётчики за период считаются от фактической очереди кейсов (`casesSeed`) — согласованы с A-07, не независимый выброс цифр. */
export const anomalyTaxonomySeed: AnomalyTaxonomyPoint[] = ANOMALY_TYPES.map((type) => {
  const currentCount = casesSeed.filter((c) => c.anomalyType === type).length;
  const priorPeriodCount = Math.max(0, currentCount + randInt(taxonomyRng, -3, 2));
  return { type, label: ANOMALY_TYPE_LABEL[type], description: ANOMALY_TYPE_DESCRIPTION[type], currentCount, priorPeriodCount };
});

// ---------------------------------------------------------------------------
// KPI (A-01) — 6 показателей стратегического слоя: значение + дельта + спарклайн за 30 дней
// ---------------------------------------------------------------------------

export type KpiGoodDirection = 'up' | 'down';

export interface KpiMetric {
  id: string;
  label: string;
  /** Готовое к выводу значение — уже отформатировано (пробелы-разделители разрядов, единица измерения). */
  formattedValue: string;
  /** Доп. значение под основным (напр. «≈ 41.6 млрд ₸ сохранённой субсидии»). */
  secondaryLabel?: string;
  deltaPct: number;
  comparisonLabel: string;
  /** Какое направление изменения считать хорошим — красит дельту в зелёный/красный (не только стрелкой). */
  goodDirection: KpiGoodDirection;
  /** 30 точек для мини-спарклайна. */
  sparkline: number[];
  /** Только для «Индекс легальности» — пороги цветовой индикации самого значения (не дельты). */
  valueTone?: 'ok' | 'warning' | 'critical';
}

interface DailySeriesOptions {
  seed: number;
  days: number;
  base: number;
  weeklyAmplitude: number;
  trendPerDay: number;
  noiseAmplitude: number;
  anomalyDayIndex: number;
  anomalyMultiplier: number;
  min?: number;
  max?: number;
  round?: number;
}

/** Дневной ряд с недельной сезонностью, трендом, шумом и одним выбросом — общий генератор для всех KPI-спарклайнов. */
function buildDailySeries(opts: DailySeriesOptions): number[] {
  const rng = mulberry32(opts.seed);
  const series: number[] = [];
  for (let day = 0; day < opts.days; day++) {
    const weekly = opts.weeklyAmplitude * Math.sin((day / 7) * Math.PI * 2);
    const trend = opts.trendPerDay * day;
    const noise = randRange(rng, -opts.noiseAmplitude, opts.noiseAmplitude);
    let value = opts.base + weekly + trend + noise;
    if (day === opts.anomalyDayIndex) value *= opts.anomalyMultiplier;
    if (opts.min !== undefined) value = Math.max(opts.min, value);
    if (opts.max !== undefined) value = Math.min(opts.max, value);
    const factor = 10 ** (opts.round ?? 0);
    series.push(Math.round(value * factor) / factor);
  }
  return series;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
function avg(values: number[]): number {
  return sum(values) / values.length;
}
function pctDelta(current: number, comparison: number): number {
  return comparison === 0 ? 0 : Math.round(((current - comparison) / comparison) * 1000) / 10;
}

const realizationSeries60 = buildDailySeries({ seed: 101, days: 60, base: 1_612_000, weeklyAmplitude: 78_000, trendPerDay: 950, noiseAmplitude: 61_000, anomalyDayIndex: 47, anomalyMultiplier: 1.34 });
const preventedExportSeries60 = buildDailySeries({ seed: 102, days: 60, base: 468_000, weeklyAmplitude: 31_000, trendPerDay: 260, noiseAmplitude: 24_000, anomalyDayIndex: 41, anomalyMultiplier: 1.52 });
const legalitySeries60 = buildDailySeries({ seed: 103, days: 60, base: 90.4, weeklyAmplitude: 1.3, trendPerDay: 0.055, noiseAmplitude: 1.1, anomalyDayIndex: 50, anomalyMultiplier: 0.91, min: 60, max: 99, round: 1 });
const nonresidentShareSeries60 = buildDailySeries({ seed: 104, days: 60, base: 9.1, weeklyAmplitude: 0.55, trendPerDay: 0.028, noiseAmplitude: 0.42, anomalyDayIndex: 38, anomalyMultiplier: 1.6, min: 0, round: 1 });
const reactionHoursSeries60 = buildDailySeries({ seed: 105, days: 60, base: 3.4, weeklyAmplitude: 0.35, trendPerDay: -0.012, noiseAmplitude: 0.28, anomalyDayIndex: 44, anomalyMultiplier: 2.1, min: 0.4, round: 2 });

const [realizationComparison, realizationCurrent] = [realizationSeries60.slice(0, 30), realizationSeries60.slice(30)];
const [preventedComparison, preventedCurrent] = [preventedExportSeries60.slice(0, 30), preventedExportSeries60.slice(30)];
const [legalityComparison, legalityCurrent] = [legalitySeries60.slice(0, 30), legalitySeries60.slice(30)];
const [nonresComparison, nonresCurrent] = [nonresidentShareSeries60.slice(0, 30), nonresidentShareSeries60.slice(30)];
const [reactionComparison, reactionCurrent] = [reactionHoursSeries60.slice(0, 30), reactionHoursSeries60.slice(30)];

const totalRealizationL = Math.round(sum(realizationCurrent));
const totalPreventedL = Math.round(sum(preventedCurrent));
/** Средняя разница льготной/предельной цены по видам топлива — множитель для оценки сохранённой субсидии. */
const avgPriceDeltaKzt = avg((['ai92', 'ai95', 'dt'] as const).map((f) => PRICE_KZT.market[f] - PRICE_KZT.preferential[f]));
const savedSubsidyKzt = Math.round(totalPreventedL * avgPriceDeltaKzt);
const legalityIndexPct = Math.round(avg(legalityCurrent) * 10) / 10;
const nonresidentSharePct = Math.round(avg(nonresCurrent) * 10) / 10;
const avgReactionHours = Math.round(avg(reactionCurrent) * 10) / 10;

const openHighRiskCount = casesSeed.filter((c) => c.riskTier === 'high' && c.status !== 'closed').length;
const openHighRiskSeries = buildDailySeries({ seed: 106, days: 30, base: Math.max(openHighRiskCount - 1, 1), weeklyAmplitude: 0.8, trendPerDay: 0.02, noiseAmplitude: 1.1, anomalyDayIndex: 12, anomalyMultiplier: 1.6, min: 0, round: 0 });
openHighRiskSeries[openHighRiskSeries.length - 1] = openHighRiskCount;
const openHighRiskComparisonValue = Math.max(1, Math.round(openHighRiskSeries[8]));

function legalityTone(pct: number): 'ok' | 'warning' | 'critical' {
  if (pct >= 95) return 'ok';
  if (pct >= 85) return 'warning';
  return 'critical';
}

/** Каталог из 6 KPI стратегического слоя (Deep Dive, таблица 4.1) — заменяет прежние 4 плашки без сравнения. */
export const kpiSeed: KpiMetric[] = [
  {
    id: 'realization',
    label: 'Объём реализации (ГСМ)',
    formattedValue: `${totalRealizationL.toLocaleString('ru-RU')} л`,
    deltaPct: pctDelta(sum(realizationCurrent), sum(realizationComparison)),
    comparisonLabel: 'за 30 дней, к прошлым 30 дням',
    goodDirection: 'up',
    sparkline: realizationCurrent,
  },
  {
    id: 'legality',
    label: 'Индекс легальности рынка',
    formattedValue: `${legalityIndexPct}%`,
    deltaPct: pctDelta(avg(legalityCurrent), avg(legalityComparison)),
    comparisonLabel: 'за 30 дней, к прошлым 30 дням',
    goodDirection: 'up',
    sparkline: legalityCurrent,
    valueTone: legalityTone(legalityIndexPct),
  },
  {
    id: 'prevented-export',
    label: 'Предотвращённый нелегальный вывоз',
    formattedValue: `${totalPreventedL.toLocaleString('ru-RU')} л`,
    secondaryLabel: `≈ ${Math.round(savedSubsidyKzt / 1_000_000).toLocaleString('ru-RU')} млн ₸ сохранённой субсидии`,
    deltaPct: pctDelta(sum(preventedCurrent), sum(preventedComparison)),
    comparisonLabel: 'за 30 дней, к прошлым 30 дням',
    goodDirection: 'up',
    sparkline: preventedCurrent,
  },
  {
    id: 'open-high-risk-cases',
    label: 'Открытые кейсы (риск High)',
    formattedValue: `${openHighRiskCount}`,
    secondaryLabel: openHighRiskCount > 0 ? 'требуют внимания сегодня' : 'все кейсы разобраны',
    deltaPct: pctDelta(openHighRiskCount, openHighRiskComparisonValue),
    comparisonLabel: 'к значению 30 дней назад',
    goodDirection: 'down',
    sparkline: openHighRiskSeries,
  },
  {
    id: 'nonresident-share',
    label: 'Доля нерезидентов в отпуске',
    formattedValue: `${nonresidentSharePct}%`,
    secondaryLabel: `приграничные ${fuelTourismSeed[0].nonresidentSharePct}% vs внутренние ${fuelTourismSeed[1].nonresidentSharePct}%`,
    deltaPct: pctDelta(avg(nonresCurrent), avg(nonresComparison)),
    comparisonLabel: 'за 30 дней, к прошлым 30 дням',
    goodDirection: 'down',
    sparkline: nonresCurrent,
  },
  {
    id: 'avg-reaction-time',
    label: 'Среднее время реакции на алерт',
    formattedValue: `${avgReactionHours} ч`,
    deltaPct: pctDelta(avg(reactionCurrent), avg(reactionComparison)),
    comparisonLabel: 'за 30 дней, к прошлым 30 дням',
    goodDirection: 'down',
    sparkline: reactionCurrent,
  },
];

/** Оценка сохранённой субсидии, тенге — используется и на A-01, и (при необходимости) в других виджетах. */
export const kpiDerived = { totalRealizationL, totalPreventedL, savedSubsidyKzt, legalityIndexPct };
