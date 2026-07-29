import { saveAs } from 'file-saver';
import type { RegionSummaryRow } from '@/lib/analyticsCompute';

const STATUS_LABEL = { ok: 'Низкий', warning: 'Средний', critical: 'Высокий' } as const;

/** Экспорт сводного отчёта по регионам (страница «Отчёт», A-модуль) — тот же формат CSV+BOM, что и в кабинете ЮЛ (`exportFleetReportCsv`). */
export function exportAnalyticsReportCsv(rows: RegionSummaryRow[]) {
  const header = ['#', 'Регион', 'Объём, т', 'Объём, л', '% от объёма РК', 'Рост объёма, %', 'Нерезидентам, %', 'Сверх лимита, %', 'Статус'];

  const csvRows = rows.map((r) => [
    String(r.rank),
    r.region,
    r.volumeT.toFixed(1),
    String(Math.round(r.volumeL)),
    String(r.volumeSharePctOfRK),
    String(r.volumeDeltaPct),
    String(r.nonresidentSharePct),
    String(r.overLimitSharePct),
    STATUS_LABEL[r.status],
  ]);

  const csv = [header, ...csvRows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `janarmai-analytics-report-${new Date().toISOString().slice(0, 10)}.csv`);
}
