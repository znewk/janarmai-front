import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { OVER_LIMIT_SHARE_THRESHOLD_PCT, shareTone, type OverLimitShareResult } from '@/lib/analyticsCompute';
import { TONE_ICON, TONE_BG, TONE_TEXT, TONE_HEX } from '@/lib/shareToneUI';
import { ChartLine } from './ChartLine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

/** Главный показатель №4 — доля операций сверх суточного лимита (объём и количество), big-number плитки + тренд. */
export function OverLimitShareCard({ result }: { result: OverLimitShareResult }) {
  const DeltaIcon = result.deltaPct === 0 ? Minus : result.deltaPct > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaClass = result.deltaPct === 0 ? 'text-navy-400' : result.deltaPct > 0 ? 'text-status-blocked' : 'text-status-ok';

  const tone = shareTone(result.volumeSharePct, OVER_LIMIT_SHARE_THRESHOLD_PCT / 2, OVER_LIMIT_SHARE_THRESHOLD_PCT);
  const ToneIcon = TONE_ICON[tone];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Доля операций сверх лимита</CardTitle>
        <CardDescription>обслуживание продолжено по рыночной цене — сверх суточного лимита</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-4 ${TONE_BG[tone]}`}>
            <div className="flex items-center justify-between gap-1">
              <p className={`text-xs font-semibold tracking-wide uppercase ${TONE_TEXT[tone]}`}>По объёму</p>
              <ToneIcon className={`h-3.5 w-3.5 shrink-0 ${TONE_TEXT[tone]}`} />
            </div>
            <p className={`mt-1 text-4xl font-bold tabular-nums ${TONE_TEXT[tone]}`}>{result.volumeSharePct}%</p>
            <p className="text-[11px] text-navy-400">{result.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т сверх лимита</p>
            <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${deltaClass}`}>
              <DeltaIcon className="h-3.5 w-3.5" />
              {Math.abs(result.deltaPct)}%
            </span>
          </div>
          <div className="rounded-2xl bg-navy-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-navy-500 uppercase">По операциям</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-navy-900">{result.opsSharePct}%</p>
            <p className="mt-1 text-xs text-navy-400">
              {result.opsCount.toLocaleString('ru-RU')} из {result.totalOpsCount.toLocaleString('ru-RU')} отпусков
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-navy-400">порог классификатора «повышенная доля сверх лимита» — {OVER_LIMIT_SHARE_THRESHOLD_PCT}%</p>
        <ChartLine data={result.trend} xKey="label" series={[{ key: 'sharePct', label: 'Доля сверх лимита, %', color: TONE_HEX[tone] }]} height={140} />
      </CardContent>
    </Card>
  );
}
