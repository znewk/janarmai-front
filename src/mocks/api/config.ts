/** Диапазон искусственной задержки сетевых имитаций, мс (тех.план раздел 2.3). */
export const MOCK_DELAY_MIN_MS = 300;
export const MOCK_DELAY_MAX_MS = 1500;

export function randomDelay(): number {
  return MOCK_DELAY_MIN_MS + Math.random() * (MOCK_DELAY_MAX_MS - MOCK_DELAY_MIN_MS);
}
