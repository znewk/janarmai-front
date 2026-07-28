import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { OverLimitShareResult } from '@/lib/analyticsCompute';
import { ChartLine } from './ChartLine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { chartCategorical } from '@/theme/colors';

/** Главный показатель №4 — доля операций сверх суточного лимита (объём и количество), big-number плитки + тренд. */
export function OverLimitShareCard({ result }: { result: OverLimitShareResult }) {
  const DeltaIcon = result.deltaPct === 0 ? Minus : result.deltaPct > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaClass = result.deltaPct === 0 ? 'text-navy-400' : result.deltaPct > 0 ? 'text-status-blocked' : 'text-status-ok';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Доля операций сверх лимита</CardTitle>
        <CardDescription>обслуживание продолжено по рыночной цене — сверх суточного лимита</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">По объёму</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-orange-600">{result.volumeSharePct}%</p>
            <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${deltaClass}`}>
              <DeltaIcon className="h-3.5 w-3.5" />
              {Math.abs(result.deltaPct)}% к пред. периоду
            </span>
          </div>
          <div className="rounded-2xl bg-navy-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-navy-500 uppercase">По операциям</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-navy-900">{result.opsSharePct}%</p>
            <p className="mt-1 text-xs text-navy-400">доля от общего числа отпусков</p>
          </div>
        </div>
        <ChartLine data={result.trend} xKey="label" series={[{ key: 'sharePct', label: 'Доля сверх лимита, %', color: chartCategorical.orange }]} height={140} />
      </CardContent>
    </Card>
  );
}
