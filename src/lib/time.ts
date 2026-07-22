/** Время Астаны — UTC+5, без перехода на летнее время. */
const ASTANA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** ISO-момент ближайшей полуночи по времени Астаны (сброс суточного лимита, ТЗ 5.1). */
export function getNextAstanaMidnightISO(fromDate: Date = new Date()): string {
  const astanaNow = new Date(fromDate.getTime() + ASTANA_OFFSET_MS);
  const astanaMidnight = new Date(
    Date.UTC(astanaNow.getUTCFullYear(), astanaNow.getUTCMonth(), astanaNow.getUTCDate() + 1, 0, 0, 0),
  );
  return new Date(astanaMidnight.getTime() - ASTANA_OFFSET_MS).toISOString();
}
