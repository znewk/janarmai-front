/**
 * Диапазон искусственной задержки сетевых имитаций, мс (тех.план раздел 2.3).
 * Увеличено с 300–1500 по просьбе ПМ: степперы проверки баз (ГБД ФЛ/ЮЛ, БМГ, «Беркут», МВД)
 * при нижней границе 300мс проскакивали визуально незаметно на демо.
 */
export const MOCK_DELAY_MIN_MS = 900;
export const MOCK_DELAY_MAX_MS = 2200;

export function randomDelay(): number {
  return MOCK_DELAY_MIN_MS + Math.random() * (MOCK_DELAY_MAX_MS - MOCK_DELAY_MIN_MS);
}
