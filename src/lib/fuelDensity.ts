import type { FuelType } from '@/types/entities';

/**
 * Плотность видов топлива при 15°C, т/м³ — для перевода объёма из литров в тонны (тонны —
 * основная единица измерения объёмных показателей аналитики, литры — вторичная, по замечанию ПМ).
 * Значения — середина типового диапазона по действующим стандартам на нефтепродукты (ГОСТ
 * 32513-2013 «Бензины автомобильные», ГОСТ 32511-2013 «Топливо дизельное ЕВРО»), не измерение
 * конкретной партии — плотность одной и той же марки в реальности колеблется в зависимости от
 * партии/сезона. Вынесены в отдельный файл, чтобы можно было легко поправить точными значениями
 * конкретного поставщика позже.
 */
export const FUEL_DENSITY_T_PER_M3: Record<FuelType, number> = {
  ai92: 0.735, // ГОСТ 32513-2013: типовой диапазон 725–735 кг/м³ для марки АИ-92
  ai95: 0.75, // ГОСТ 32513-2013: типовой диапазон 730–750 кг/м³ для марки АИ-95
  ai98: 0.76, // ГОСТ 32513-2013: типовой диапазон 750–770 кг/м³ для марки АИ-98 (выше — за счёт присадок)
  ai100: 0.765, // ГОСТ 32513-2013: премиальная марка, верх типового диапазона для бензинов
  dt_summer: 0.84, // ГОСТ 32511-2013: летнее ДТ, типовой диапазон 820–845 кг/м³ при 15°C
  dt_winter: 0.825, // ГОСТ 32511-2013: зимнее ДТ легче летнего (ниже температура помутнения/фильтруемости), типовой диапазон 800–840 кг/м³
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
