import type { FuelType } from '@/types/entities';

/**
 * Плотность видов топлива, т/м³ — для перевода объёма из литров в тонны (по замечанию ПМ:
 * тонны — основная единица измерения объёмных показателей аналитики, литры — вторичная).
 * Значения ориентировочные (типичный диапазон ГОСТ), вынесены в отдельный файл, чтобы их
 * можно было легко поправить точными значениями позже, без правок в местах использования.
 */
export const FUEL_DENSITY_T_PER_M3: Record<FuelType, number> = {
  ai92: 0.735,
  ai95: 0.75,
  ai98: 0.76,
  dt: 0.84,
};

/** Средняя (по рынку) плотность — для виджетов без разреза по марке топлива (напр. разрыв по контрагентам). */
export const AVG_FUEL_DENSITY_T_PER_M3 =
  Object.values(FUEL_DENSITY_T_PER_M3).reduce((a, b) => a + b, 0) / Object.values(FUEL_DENSITY_T_PER_M3).length;

export function litersToTons(volumeL: number, fuelType: FuelType): number {
  return (volumeL / 1000) * FUEL_DENSITY_T_PER_M3[fuelType];
}

export function tonsToLiters(volumeT: number, fuelType: FuelType): number {
  return (volumeT / FUEL_DENSITY_T_PER_M3[fuelType]) * 1000;
}

/** Перевод без разреза по марке — усреднённой плотностью (см. AVG_FUEL_DENSITY_T_PER_M3). */
export function litersToTonsAvg(volumeL: number): number {
  return (volumeL / 1000) * AVG_FUEL_DENSITY_T_PER_M3;
}

export function formatTons(volumeT: number, fractionDigits = 1): string {
  return `${volumeT.toLocaleString('ru-RU', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} т`;
}
