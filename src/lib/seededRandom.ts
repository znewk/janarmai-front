/**
 * Детерминированный генератор псевдослучайных чисел (mulberry32) — для seed-данных аналитики,
 * которым по Analytics Deep Dive (разд. 5) нужен «реалистичный шум» вместо круглых чисел, но
 * которые не должны дрейфовать между перезапусками дев-сервера/сборками (иначе демо и дымовые
 * тесты давали бы разные числа каждый раз). НЕ использовать для рантайм-сущностей (карты,
 * транзакции и т.п. — там уместен настоящий `Math.random()`/`crypto.randomUUID()`, как и было).
 */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Число в [min, max) с заданным генератором — короткая обвязка, используемая по всему analytics.seed.ts. */
export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Целое число в [min, max] включительно. */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(randRange(rng, min, max + 1));
}

/** Случайный элемент массива с заданным генератором. */
export function randChoice<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export interface DailySeriesOptions {
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

/** Дневной ряд с недельной сезонностью, трендом, шумом и одним выбросом — общий генератор для всех аналитических рядов. */
export function buildDailySeries(opts: DailySeriesOptions): number[] {
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

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
export function avg(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}
export function pctDelta(current: number, comparison: number): number {
  return comparison === 0 ? 0 : Math.round(((current - comparison) / comparison) * 1000) / 10;
}

/** Простой детерминированный хеш строки → число, для получения независимого seed на пару (регион, марка). */
export function hashSeed(input: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(h ^ input.charCodeAt(i), 2654435761) >>> 0) + i;
  }
  return h >>> 0;
}
