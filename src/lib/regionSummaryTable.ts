import type { RegionSummaryRow, ShareTone } from './analyticsCompute';

/** Общие для тепловой карты и страницы «Отчёт» колонки/сортировка сводной таблицы по регионам — вынесены, чтобы не дублировать между `KzHeatMap.tsx` и `ReportPage.tsx`. */
export type SummarySortField = 'region' | 'volumeT' | 'volumeSharePctOfRK' | 'volumeDeltaPct' | 'nonresidentSharePct' | 'overLimitSharePct' | 'status';

export const STATUS_SORT_RANK: Record<ShareTone, number> = { ok: 0, warning: 1, critical: 2 };

export const SUMMARY_COLUMNS: { field: SummarySortField; label: string }[] = [
  { field: 'region', label: 'Регион' },
  { field: 'volumeT', label: 'Объём' },
  { field: 'volumeSharePctOfRK', label: '% от объёма РК' },
  { field: 'volumeDeltaPct', label: 'Рост объёма' },
  { field: 'nonresidentSharePct', label: 'Нерезидентам' },
  { field: 'overLimitSharePct', label: 'Сверх лимита' },
  { field: 'status', label: 'Статус' },
];

export function summarySortValue(row: RegionSummaryRow, field: SummarySortField): number | string {
  if (field === 'region') return row.region;
  if (field === 'status') return STATUS_SORT_RANK[row.status];
  return row[field];
}

export function sortSummaries(rows: RegionSummaryRow[], field: SummarySortField, dir: 'asc' | 'desc'): RegionSummaryRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const va = summarySortValue(a, field);
    const vb = summarySortValue(b, field);
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'ru') : (va as number) - (vb as number);
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}
