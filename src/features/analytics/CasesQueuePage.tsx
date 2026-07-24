import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { FilterBar, type FilterDef } from '@/components/ui/FilterBar';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ANOMALY_TYPE_LABEL, CASE_STATUS_BADGE_VARIANT, CASE_STATUS_LABEL } from '@/lib/riskTier';
import { useCaseStore } from '@/store/case.store';
import type { AnomalyType, CaseStatus } from '@/types/entities';

type Period = 'all' | '7d' | '30d';

function formatCaseDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** A-07 — очередь кейсов: таблица, сортировка по убыванию риск-балла, фильтры (Analytics Deep Dive 4.3). */
export function CasesQueuePage() {
  const navigate = useNavigate();
  const cases = useCaseStore((s) => s.cases);

  const [period, setPeriod] = useState<Period>('all');
  const [region, setRegion] = useState('all');
  const [anomalyType, setAnomalyType] = useState<'all' | AnomalyType>('all');
  const [status, setStatus] = useState<'all' | CaseStatus>('all');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const regionOptions = useMemo(() => Array.from(new Set(cases.map((c) => c.region))).sort(), [cases]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = period === '7d' ? now - 7 * 86_400_000 : period === '30d' ? now - 30 * 86_400_000 : null;
    return cases
      .filter((c) => (cutoff === null ? true : new Date(c.dateTime).getTime() >= cutoff))
      .filter((c) => (region === 'all' ? true : c.region === region))
      .filter((c) => (anomalyType === 'all' ? true : c.anomalyType === anomalyType))
      .filter((c) => (status === 'all' ? true : c.status === status))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [cases, period, region, anomalyType, status]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const pagedCases = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const filters: FilterDef[] = [
    {
      label: 'Период',
      value: period,
      onChange: (v) => setPeriod(v as Period),
      options: [
        { value: 'all', label: 'Весь период' },
        { value: '7d', label: '7 дней' },
        { value: '30d', label: '30 дней' },
      ],
    },
    {
      label: 'Регион',
      value: region,
      onChange: setRegion,
      options: [{ value: 'all', label: 'Все регионы' }, ...regionOptions.map((r) => ({ value: r, label: r }))],
    },
    {
      label: 'Тип аномалии',
      value: anomalyType,
      onChange: (v) => setAnomalyType(v as 'all' | AnomalyType),
      options: [
        { value: 'all', label: 'Все типы' },
        ...(Object.keys(ANOMALY_TYPE_LABEL) as AnomalyType[]).map((t) => ({ value: t, label: ANOMALY_TYPE_LABEL[t] })),
      ],
    },
    {
      label: 'Статус',
      value: status,
      onChange: (v) => setStatus(v as 'all' | CaseStatus),
      options: [
        { value: 'all', label: 'Все статусы' },
        ...(Object.keys(CASE_STATUS_LABEL) as CaseStatus[]).map((s) => ({ value: s, label: CASE_STATUS_LABEL[s] })),
      ],
    },
  ];

  useEffect(() => {
    setPage(1);
  }, [period, region, anomalyType, status]);

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" onClick={() => navigate('/admin/dashboard')} aria-label="К дашборду">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs text-navy-400">A-07 · Операционный слой</p>
          <h1 className="text-xl font-bold text-navy-900">Очередь кейсов ({filtered.length})</h1>
        </div>
      </div>

      <FilterBar filters={filters} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Риск-балл</TableHead>
            <TableHead>Дата / время</TableHead>
            <TableHead>Регион / АЗС</TableHead>
            <TableHead>ИИН / БИН</TableHead>
            <TableHead>Тип аномалии</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedCases.map((c) => (
            <TableRow key={c.id} onClick={() => navigate(`/admin/cases/${c.id}`)} className="cursor-pointer">
              <TableCell>
                <RiskBadge tier={c.riskTier} score={c.riskScore} />
              </TableCell>
              <TableCell className="tabular-nums text-navy-500">{formatCaseDate(c.dateTime)}</TableCell>
              <TableCell className="text-navy-700">
                {c.region} · {c.stationName}
              </TableCell>
              <TableCell className="tabular-nums text-navy-500">{c.maskedId}</TableCell>
              <TableCell className="text-navy-700">{ANOMALY_TYPE_LABEL[c.anomalyType]}</TableCell>
              <TableCell>
                <Badge variant={CASE_STATUS_BADGE_VARIANT[c.status]}>{CASE_STATUS_LABEL[c.status]}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-navy-400">
                Нет кейсов по выбранным фильтрам.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-navy-500">
          Показано{" "}
          <span className="font-medium">
            {Math.min((page - 1) * pageSize + 1, filtered.length)}
          </span>
          {"–"}
          <span className="font-medium">
            {Math.min(page * pageSize, filtered.length)}
          </span>{" "}
          из <span className="font-medium">{filtered.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>

          <span className="text-sm text-navy-600">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      </div>
    </div>
  );
}
