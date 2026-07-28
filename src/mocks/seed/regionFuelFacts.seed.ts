import type { FuelType } from '@/types/entities';
import { buildDailySeries, hashSeed } from '@/lib/seededRandom';
import { REGION_BASE_CONSUMPTION, KZ_REGION_NAMES, ELEVATED_RISK_BORDER_REGIONS, BORDER_REGIONS, ELEVATED_OVER_LIMIT_REGIONS } from './regions';

/**
 * Фактовая таблица отпуска топлива на грануле (день × регион × марка) — по замечаниям ПМ
 * (см. PROGRESS.md, «Переработка аналитического модуля»): раньше каждый виджет дашборда питался
 * от независимого, никак не связанного с остальными и не фильтруемого генератора. Здесь — одна
 * таблица, из которой через `src/lib/analyticsCompute.ts` считаются все 4 главных показателя,
 * боковая панель тепловой карты и классификатор аномалий, с учётом текущих глобальных фильтров
 * (период/регион/марка/резидентство/тип держателя). Подход к генерации шума/сезонности —
 * тот же `buildDailySeries` (недельная сезонность + шум + выброс), что уже использовался в
 * `analytics.seed.ts` — не переизобретается, только применяется на более мелкой грануле.
 *
 * 60 дней × 20 регионов × 6 марок = 7200 строк, генерируется один раз при загрузке модуля.
 */

export const FACTS_DAYS = 60;
/** Последний день ряда — согласован с «текущей» датой остальных seed-файлов проекта (карты/транзакции). */
export const FACTS_END_DATE = '2026-07-22';

function dayIndexToISO(dayIndex: number): string {
  const end = new Date(`${FACTS_END_DATE}T00:00:00.000Z`);
  const d = new Date(end.getTime() - (FACTS_DAYS - 1 - dayIndex) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Все даты ряда по порядку, `FACT_DATES[0]` — самый ранний день, `FACT_DATES[FACTS_DAYS-1]` === `FACTS_END_DATE`. */
export const FACT_DATES: string[] = Array.from({ length: FACTS_DAYS }, (_, i) => dayIndexToISO(i));

export const FUEL_TYPES: FuelType[] = ['ai92', 'ai95', 'ai98', 'ai100', 'dt_summer', 'dt_winter'];

/**
 * Условная доля марки в общем отпуске — реалистичное распределение (ДТ — грузовой транспорт,
 * АИ-98/АИ-100 — нишевые премиальные марки). ДТ разбито на летнее/зимнее: ряд данных заканчивается
 * в июле (см. FACTS_END_DATE), поэтому зимнее ДТ намеренно взято с малым весом — не сезон.
 */
const FUEL_WEIGHTS: Record<FuelType, number> = { ai92: 0.36, ai95: 0.3, ai98: 0.06, ai100: 0.02, dt_summer: 0.17, dt_winter: 0.09 };

/** Масштаб суточного объёма (л) — подобран так, чтобы суммарные цифры за период выглядели правдоподобно, не претендуя на точное соответствие реальной статистике РК (демо-данные). */
const VOLUME_SCALE = 3000;

export interface RegionFuelDailyFact {
  date: string;
  region: string;
  fuelType: FuelType;
  /** Общий объём отпуска за день, л. */
  volumeL: number;
  /** Подмножество volumeL — отпущено держателям карт-нерезидентов. */
  nonresidentVolumeL: number;
  /** Подмножество volumeL — отпущено по рыночной (не льготной) цене, т.е. сверх суточного лимита. */
  marketVolumeL: number;
  /** Подмножество volumeL — отпущено по льготной цене (в пределах лимита). volumeL === marketVolumeL + preferentialVolumeL. */
  preferentialVolumeL: number;
  /** Синтетическое количество операций отпуска (транзакций) за день. */
  opsCount: number;
  /** Подмножество opsCount — операции сверх лимита. */
  overLimitOpsCount: number;
  /** Закуп по СУНП за день, л (>= volumeL — часть закупленного объёма не находит отражения в продажах). */
  purchaseVolumeL: number;
}

/**
 * Явные случаи «резкого оттока марки топлива в регионе»: вторая половина периода занижена
 * намеренно, чтобы новому классификатору было что обнаруживать (порог см. в OPEN_QUESTIONS.md).
 */
const FUEL_DROPOFF_CASES: { region: string; fuelType: FuelType; factor: number }[] = [
  { region: 'Костанайская', fuelType: 'ai95', factor: 0.52 },
  { region: 'Туркестанская', fuelType: 'dt_summer', factor: 0.58 },
];

function nonresidentShareBase(region: string): number {
  if (ELEVATED_RISK_BORDER_REGIONS.has(region)) return 31;
  if (BORDER_REGIONS.has(region)) return 17;
  return 2.4;
}

function overLimitShareBase(region: string): number {
  return ELEVATED_OVER_LIMIT_REGIONS.has(region) ? 23 : 6;
}

/** Доля нерезидентов/сверхлимита/закуп-коэффициент — по одному ряду на регион (не зависят от марки топлива). */
const nonresidentShareByRegion = new Map<string, number[]>();
const overLimitShareByRegion = new Map<string, number[]>();
const complianceRatioByRegion = new Map<string, number[]>();

for (const region of KZ_REGION_NAMES) {
  const nrBase = nonresidentShareBase(region);
  nonresidentShareByRegion.set(
    region,
    buildDailySeries({
      seed: hashSeed(region, 5001),
      days: FACTS_DAYS,
      base: nrBase,
      weeklyAmplitude: nrBase * 0.06,
      trendPerDay: 0,
      noiseAmplitude: nrBase * 0.12,
      anomalyDayIndex: -1,
      anomalyMultiplier: 1,
      min: 0,
      max: 60,
      round: 1,
    }),
  );

  const olBase = overLimitShareBase(region);
  overLimitShareByRegion.set(
    region,
    buildDailySeries({
      seed: hashSeed(region, 6002),
      days: FACTS_DAYS,
      base: olBase,
      weeklyAmplitude: olBase * 0.08,
      trendPerDay: 0,
      noiseAmplitude: olBase * 0.15,
      anomalyDayIndex: -1,
      anomalyMultiplier: 1,
      min: 0,
      max: 70,
      round: 1,
    }),
  );

  complianceRatioByRegion.set(
    region,
    buildDailySeries({
      seed: hashSeed(region, 7003),
      days: FACTS_DAYS,
      base: 91,
      trendPerDay: 0.09,
      weeklyAmplitude: 0.6,
      noiseAmplitude: 1.4,
      anomalyDayIndex: 24,
      anomalyMultiplier: 0.91,
      min: 78,
      max: 99,
      round: 1,
    }),
  );
}

function buildFacts(): RegionFuelDailyFact[] {
  const rows: RegionFuelDailyFact[] = [];

  for (const region of KZ_REGION_NAMES) {
    const regionWeight = REGION_BASE_CONSUMPTION[region];
    const nonresShare = nonresidentShareByRegion.get(region)!;
    const overLimitShare = overLimitShareByRegion.get(region)!;
    const compliance = complianceRatioByRegion.get(region)!;
    const avgOpVolumeL = 38 + (hashSeed(region, 8004) % 18); // 38–55 л на операцию, стабильно на регион

    for (const fuelType of FUEL_TYPES) {
      const base = regionWeight * FUEL_WEIGHTS[fuelType] * VOLUME_SCALE;
      let volumeSeries = buildDailySeries({
        seed: hashSeed(`${region}|${fuelType}`, 9005),
        days: FACTS_DAYS,
        base,
        weeklyAmplitude: base * 0.09,
        trendPerDay: base * 0.0025,
        noiseAmplitude: base * 0.14,
        anomalyDayIndex: hashSeed(`${region}|${fuelType}`, 1) % FACTS_DAYS,
        anomalyMultiplier: 1.3,
        min: 0,
      });

      const dropoff = FUEL_DROPOFF_CASES.find((c) => c.region === region && c.fuelType === fuelType);
      if (dropoff) {
        volumeSeries = volumeSeries.map((v, dayIdx) => (dayIdx >= FACTS_DAYS - 28 ? v * dropoff.factor : v));
      }

      for (let dayIdx = 0; dayIdx < FACTS_DAYS; dayIdx++) {
        const volumeL = Math.max(0, Math.round(volumeSeries[dayIdx]));
        const nonresidentVolumeL = Math.round((volumeL * nonresShare[dayIdx]) / 100);
        const marketVolumeL = Math.round((volumeL * overLimitShare[dayIdx]) / 100);
        const preferentialVolumeL = volumeL - marketVolumeL;
        const opsCount = Math.max(1, Math.round(volumeL / avgOpVolumeL));
        const overLimitOpsCount = Math.min(opsCount, Math.round(opsCount * (overLimitShare[dayIdx] / 100)));
        const purchaseVolumeL = Math.round(volumeL / (compliance[dayIdx] / 100));

        rows.push({ date: FACT_DATES[dayIdx], region, fuelType, volumeL, nonresidentVolumeL, marketVolumeL, preferentialVolumeL, opsCount, overLimitOpsCount, purchaseVolumeL });
      }
    }
  }

  return rows;
}

export const regionFuelFactsSeed: RegionFuelDailyFact[] = buildFacts();
