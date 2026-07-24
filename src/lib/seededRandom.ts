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
