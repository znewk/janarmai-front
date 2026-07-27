import { mulberry32, randRange } from '@/lib/seededRandom';
import { riskTierOf } from '@/lib/riskTier';
import { REGION_BASE_CONSUMPTION, BORDER_REGIONS, ELEVATED_RISK_BORDER_REGIONS } from './regions';

export { buildDailySeries, sum, avg, pctDelta, hashSeed } from '@/lib/seededRandom';
export type { DailySeriesOptions } from '@/lib/seededRandom';

/**
 * Сгенерированные наборы данных для аналитического модуля (ТЗ раздел 6, 8.5 + дополнение
 * `JanarmAI_Analytics_Deep_Dive.docx`, разд. 5): значения детерминированы seeded-PRNG
 * (`mulberry32`, не «голый» `Math.random()` — числа не должны дрейфовать между перезапусками),
 * но при этом намеренно НЕ круглые и содержат сезонность + минимум один выброс на каждый ряд —
 * по прямому требованию дополнения («никаких круглых чисел... данные шумные, с неровными хвостами»).
 *
 * Границы регионов для тепловой карты (src/mocks/geo/kz-oblasts.json, 20 регионов, актуализация 2024 г.):
 * geokz (github.com/arodionoff/geokz, CC BY 4.0), на основе UN OCHA COD-AB Kazakhstan.
 *
 * После доработки по замечаниям ПМ (см. PROGRESS.md, «Переработка аналитического модуля»)
 * главные показатели (объём по маркам/тоннам, сверка с СУНП, доля нерезидентам, доля сверх
 * лимита) и классификатор аномалий считаются из фактовой таблицы `regionFuelFacts.seed.ts` —
 * здесь остаются только показатели, которые эта переработка не затронула: заливка тепловой
 * карты по риск-тиру региона, статичный снимок «Структура потребления», рейтинг сетей АЗС и
 * разрыв «закуп СУНП vs факт» по контрагентам (сеть/контрагент — измерение, не добавленное
 * в новую факт-таблицу, см. допущение в OPEN_QUESTIONS.md).
 */

export const MONTH_LABELS = ['Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл'];

// ---------------------------------------------------------------------------
// Разрыв «закуп по СУНП vs факт» по топ-5 контрагентам/сетям (Deep Dive 4.2, по аналогии с Кенией)
// ---------------------------------------------------------------------------

export interface GapCounterparty {
  name: string;
  gapVolumeL: number;
  gapSharePct: number;
}

const gapRng = mulberry32(4402);
const GAP_COUNTERPARTIES = ['КМГ АЗС', 'Sinooil', 'Гелиос', 'ТОО «НефтеТрейд Империал»', 'ИП Байсеитов А.М.'];
/** Совокупный разрыв закуп/факт за период — независимая (от факт-таблицы) оценка, тот же порядок величины. */
const TOTAL_GAP_L = 3_180_000 + Math.round(randRange(gapRng, -120_000, 140_000));

/** Долгий хвост, не равномерное деление — один контрагент даёт заметно больше остальных (типичная картина в реальных аудитах). */
const rawGapWeights = GAP_COUNTERPARTIES.map((_, i) => (i === 0 ? randRange(gapRng, 32, 41) : randRange(gapRng, 6, 22)));
const gapWeightSum = rawGapWeights.reduce((a, b) => a + b, 0);

/** Переименовано из `legalityGapByCounterpartySeed` — слово «легальность» больше не используется в UI-контексте. */
export const procurementGapByCounterpartySeed: GapCounterparty[] = GAP_COUNTERPARTIES.map((name, i) => {
  const gapSharePct = Math.round((rawGapWeights[i] / gapWeightSum) * 1000) / 10;
  return { name, gapSharePct, gapVolumeL: Math.round((TOTAL_GAP_L * rawGapWeights[i]) / gapWeightSum) };
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
// Структура потребления резиденты/нерезиденты (A-05) — статичный помесячный снимок.
// Понижен из главных показателей в тактический/второстепенный блок (по замечанию ПМ) —
// сам генератор не менялся, только положение виджета на дашборде.
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
// Регионы РК — потребление, риск-тир (A-04, заливка тепловой карты по severity)
// ---------------------------------------------------------------------------

export interface RegionConsumptionPoint {
  name: string;
  consumptionIndex: number;
  isBorderRegion: boolean;
  riskScore: number;
  riskTier: 'high' | 'medium' | 'low';
}

const regionRng = mulberry32(2201);

export const regionConsumptionSeed: RegionConsumptionPoint[] = Object.entries(REGION_BASE_CONSUMPTION).map(([name, consumptionIndex]) => {
  const isBorderRegion = BORDER_REGIONS.has(name);
  const isElevated = ELEVATED_RISK_BORDER_REGIONS.has(name);
  let riskScore = isBorderRegion ? randRange(regionRng, 56, 79) : randRange(regionRng, 9, 52);
  if (isElevated) riskScore = randRange(regionRng, 81, 94);
  riskScore = Math.round(riskScore);

  return { name, consumptionIndex, isBorderRegion, riskScore, riskTier: riskTierOf(riskScore) };
});
