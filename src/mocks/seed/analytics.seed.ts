/**
 * Сгенерированные наборы данных для аналитического модуля (ТЗ раздел 6, 8.5).
 * Значения детерминированные (формула сезонности + фиксированные аномалии), не случайный шум —
 * как явно требует ТЗ раздел 6: «реалистично имитирующие сезонность и аномалии».
 * Все значения иллюстративны (см. ТЗ раздел 7).
 *
 * Границы регионов для тепловой карты (src/mocks/geo/kz-oblasts.json, 20 регионов, актуализация 2024 г.):
 * geokz (github.com/arodionoff/geokz, CC BY 4.0), на основе UN OCHA COD-AB Kazakhstan.
 */

const MONTH_LABELS = ['Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл'];

export interface MonthlyLegalityPoint {
  month: string;
  sntVolumeMlnL: number;
  salesVolumeMlnL: number;
  legalityIndexPct: number;
}

/**
 * Закуп по СНТ (сопроводительные накладные на товары) — физический объём поставок, сезонный (пик в агро-/турсезон).
 * Фактические продажи ниже закупа из-за нелегального оборота; разрыв сокращается по месяцам —
 * демонстрация эффекта внедрения JanarmAI (индекс легальности растёт).
 */
export const monthlyLegalitySeed: MonthlyLegalityPoint[] = MONTH_LABELS.map((month, i) => {
  const seasonal = 55 + 12 * Math.sin(((i + 10) / 12) * Math.PI * 2); // пик к середине лета
  const sntVolumeMlnL = Math.round(seasonal * 10) / 10;
  const legalityIndexPct = Math.round(78 + (94 - 78) * (i / (MONTH_LABELS.length - 1)));
  const salesVolumeMlnL = Math.round(((sntVolumeMlnL * legalityIndexPct) / 100) * 10) / 10;
  return { month, sntVolumeMlnL, salesVolumeMlnL, legalityIndexPct };
});

export interface StationNetworkStat {
  network: string;
  janarmaiAuthorizations: number;
  ofdReceipts: number;
}

/** Сверка авторизаций JanarmAI против чеков ОФД по сетям АЗС — «Гелиос» демонстрирует аномалию (расхождение). */
export const stationNetworkStatsSeed: StationNetworkStat[] = [
  { network: 'КМГ АЗС', janarmaiAuthorizations: 182_400, ofdReceipts: 183_100 },
  { network: 'Sinooil', janarmaiAuthorizations: 94_700, ofdReceipts: 97_200 },
  { network: 'Гелиос', janarmaiAuthorizations: 61_300, ofdReceipts: 79_900 },
];

export interface ConsumptionStructurePoint {
  month: string;
  residentSharePct: number;
  nonresidentSharePct: number;
}

/** Динамика доли нерезидентов — растёт к последним месяцам (акцент ТЗ 1 на приграничный дефицит/вывоз). */
export const consumptionStructureSeed: ConsumptionStructurePoint[] = MONTH_LABELS.map((month, i) => {
  const nonresidentSharePct = Math.round((6 + 5 * (i / (MONTH_LABELS.length - 1))) * 10) / 10;
  return { month, nonresidentSharePct, residentSharePct: Math.round((100 - nonresidentSharePct) * 10) / 10 };
});

export interface RegionConsumptionPoint {
  name: string;
  consumptionIndex: number;
  isBorderRegion: boolean;
  anomalyScore: number;
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

/** Индекс потребления по областям + аномалия — выше у приграничных регионов (мониторинг вывоза, ТЗ 1/6). */
export const regionConsumptionSeed: RegionConsumptionPoint[] = Object.entries(REGION_BASE_CONSUMPTION).map(([name, consumptionIndex]) => {
  const isBorderRegion = BORDER_REGIONS.has(name);
  const anomalyScore = isBorderRegion ? Math.round((18 + (consumptionIndex % 10)) * 10) / 10 : Math.round((4 + (consumptionIndex % 6)) * 10) / 10;
  return { name, consumptionIndex, isBorderRegion, anomalyScore };
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

export type ControlRuleStatus = 'ok' | 'blocked';

export interface ControlRule {
  id: string;
  title: string;
  description: string;
  status: ControlRuleStatus;
}

/** Блок «Интеллектуальный контроль» — карточки-правила (ТЗ 8.5). */
export const controlRulesSeed: ControlRule[] = [
  { id: 'rule_over_limit', title: 'Превышение суточного лимита', description: 'Обслуживание продолжено по предельной цене, без блокировки', status: 'ok' },
  { id: 'rule_multi_station', title: 'Одна карта — несколько АЗС за 10 минут', description: 'Физически невозможная последовательность заправок — подозрение на перепродажу', status: 'blocked' },
  { id: 'rule_border_export', title: 'Отпуск иностранцу сверх нормы в приграничном регионе', description: 'Повышенный объём у одного и того же паспорта — мониторинг вывоза за рубеж', status: 'blocked' },
  { id: 'rule_multi_region', title: 'Заправки в разных регионах в один день', description: 'Расстояние между АЗС не проходимо за интервал между операциями', status: 'blocked' },
  { id: 'rule_new_card', title: 'Новая карта, первая заправка в пределах лимита', description: 'Стандартная операция, аномалий не обнаружено', status: 'ok' },
];

export interface KpiSeed {
  totalRealizationMlnL: number;
  preventedExportMlnL: number;
  savedSubsidyKzt: number;
  legalityIndexPct: number;
}

/** KPI-плашки A-01 — значения по образцу презентации-концепции (ТЗ 8.5: «50 млн л», «15 млн л»). */
export const kpiSeed: KpiSeed = {
  totalRealizationMlnL: 50,
  preventedExportMlnL: 15,
  savedSubsidyKzt: 825_000_000,
  legalityIndexPct: monthlyLegalitySeed[monthlyLegalitySeed.length - 1].legalityIndexPct,
};
