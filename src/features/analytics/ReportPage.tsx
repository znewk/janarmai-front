import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { AnalyticsFilterBar } from '@/components/ui/AnalyticsFilterBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { computeRegionSummaries, DEFAULT_FILTERS, VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT, type DashboardFilters } from '@/lib/analyticsCompute';
import { SUMMARY_COLUMNS, sortSummaries, type SummarySortField } from '@/lib/regionSummaryTable';
import { TONE_ICON, TONE_TEXT, REGION_STATUS_EXPLANATION, VOLUME_GROWTH_EXPLANATION } from '@/lib/shareToneUI';
import { regionFuelFactsSeed } from '@/mocks/seed';
import { cn } from '@/lib/utils';
import { exportAnalyticsReportCsv } from './exportAnalyticsReportCsv';

const TONE_LABEL = { ok: 'Низкий', warning: 'Средний', critical: 'Высокий' } as const;

/**
 * Страница «Отчёт» (по запросу ПМ) — тот же единый блок фильтров, что на дашборде, плюс
 * предпросмотр сводной таблицы по регионам (`computeRegionSummaries`, та же логика, что под
 * тепловой картой — вынесена в `src/lib/regionSummaryTable.ts`, чтобы не дублировать сортировку)
 * и кнопка «Скачать отчёт» (CSV, тот же паттерн, что экспорт автопарка в кабинете ЮЛ).
 */
export function ReportPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SummarySortField>('volumeT');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const summaries = useMemo(() => computeRegionSummaries(regionFuelFactsSeed, filters), [filters]);
  const sortedSummaries = useMemo(() => sortSummaries(summaries, sortField, sortDir), [summaries, sortField, sortDir]);

  const handleFiltersChange = (patch: Partial<DashboardFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const handleSort = (field: SummarySortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'region' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-900">Отчёт</h1>
        <Button type="button" onClick={() => exportAnalyticsReportCsv(sortedSummaries)} className="gap-2">
          <Download className="h-4 w-4" />
          Скачать отчёт
        </Button>
      </div>

      <AnalyticsFilterBar filters={filters} onChange={handleFiltersChange} />

      <Card>
        <CardHeader>
          <CardTitle>Предпросмотр — сводная таблица по регионам</CardTitle>
          <CardDescription>
            {sortedSummaries.length} регионов · клик по заголовку столбца сортирует. В выгрузку попадают строки в текущем порядке сортировки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-navy-400 uppercase">#</th>
                  {SUMMARY_COLUMNS.map((col) => {
                    const active = sortField === col.field;
                    const SortIcon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        className={cn(
                          'cursor-pointer select-none px-3 py-2 text-[11px] font-semibold tracking-wide text-navy-400 uppercase hover:text-navy-600',
                          col.field !== 'region' && 'text-right',
                        )}
                      >
                        <span className={cn('inline-flex items-center gap-1', col.field !== 'region' && 'flex-row-reverse')}>
                          {col.label}
                          <SortIcon className={cn('h-3 w-3', active && 'text-orange-600')} />
                          {col.field === 'status' && <InfoTooltip text={REGION_STATUS_EXPLANATION} />}
                          {col.field === 'volumeDeltaPct' && <InfoTooltip text={VOLUME_GROWTH_EXPLANATION} />}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedSummaries.map((row) => {
                  const StatusIcon = TONE_ICON[row.status];
                  return (
                    <tr key={row.region} className="border-t border-navy-50 text-sm hover:bg-navy-50/60">
                      <td className="px-3 py-2 text-navy-400">{row.rank}</td>
                      <td className="px-3 py-2 font-medium text-navy-900">{row.region}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className="font-semibold text-navy-900">
                          {row.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т
                        </span>
                        <span className="ml-1.5 text-[11px] text-navy-400">{Math.round(row.volumeL).toLocaleString('ru-RU')} л</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-navy-600">{row.volumeSharePctOfRK}%</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {(() => {
                          const notable = row.volumeDeltaPct >= VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT;
                          const GrowthIcon = row.volumeDeltaPct > 0 ? TrendingUp : row.volumeDeltaPct < 0 ? TrendingDown : Minus;
                          return (
                            <span className={cn('inline-flex items-center gap-1 font-semibold', notable ? 'text-blue-600' : 'text-navy-500')}>
                              <GrowthIcon className="h-3.5 w-3.5" />
                              {row.volumeDeltaPct > 0 ? '+' : ''}
                              {row.volumeDeltaPct}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-navy-600">{row.nonresidentSharePct}%</td>
                      <td className="px-3 py-2 text-right tabular-nums text-navy-600">{row.overLimitSharePct}%</td>
                      <td className="px-3 py-2 text-right">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', TONE_TEXT[row.status])}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {TONE_LABEL[row.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
