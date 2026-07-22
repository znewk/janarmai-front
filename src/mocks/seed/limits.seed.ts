import type { FuelType, VehicleCategory } from '@/types/entities';

/** Справочник суточных лимитов, л/сутки (ТЗ раздел 3) — по действовавшему на момент презентации НПА. */
export const DAILY_LIMIT_L: Record<VehicleCategory, number> = {
  passenger: 100,
  truck: 300,
};

/** Персональный лимит ФЛ без собственного ТС (вписан в чужой ОГПО) — по логике 4.1/4.2 приравнен к легковой категории. */
export const PERSONAL_DAILY_LIMIT_L = 100;

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  ai92: 'АИ-92',
  ai95: 'АИ-95',
  dt: 'ДТ',
};

/** Мок-цены, тенге/л — иллюстративные значения, подлежат уточнению после нового НПА (ТЗ 7). */
export const PRICE_KZT: Record<'preferential' | 'market', Record<FuelType, number>> = {
  preferential: { ai92: 205, ai95: 230, dt: 295 },
  market: { ai92: 260, ai95: 300, dt: 370 },
};
