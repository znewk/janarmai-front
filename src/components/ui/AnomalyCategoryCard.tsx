import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { AnomalyClassifierPoint } from '@/lib/analyticsCompute';
import { Card } from './card';

export interface AnomalyCategoryCardProps {
  point: AnomalyClassifierPoint;
  icon: LucideIcon;
}

/** Карточка категории классификатора аномалий — счётчик за период + дельта к прошлому периоду. */
export function AnomalyCategoryCard({ point, icon: Icon }: AnomalyCategoryCardProps) {
  const delta = point.currentCount - point.priorPeriodCount;
  const DeltaIcon = delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaClass = delta === 0 ? 'text-navy-400' : delta > 0 ? 'text-status-blocked' : 'text-status-ok';

  return (
    <Card className="flex-row items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-600">
        <Icon className="h-5 w-5 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-navy-900">{point.label}</p>
          <span className="text-lg font-bold text-navy-900">{point.currentCount}</span>
        </div>
        <p className="text-xs text-navy-400">{point.description}</p>
        <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${deltaClass}`}>
          <DeltaIcon className="h-3 w-3" />
          {Math.abs(delta)} к прошлому периоду
        </span>
      </div>
    </Card>
  );
}
