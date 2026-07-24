import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { Card, cardBaseClassName } from './card';
import { cn } from '@/lib/utils';
import { status as statusColors } from '@/theme/colors';
import type { KpiGoodDirection } from '@/mocks/seed';

export interface KpiTileProps {
  label: string;
  formattedValue: string;
  secondaryLabel?: string;
  deltaPct: number;
  comparisonLabel: string;
  /** Какое направление изменения — хорошая новость; красит дельту в зелёный/красный, а не только стрелкой. */
  goodDirection: KpiGoodDirection;
  sparkline: number[];
  /** Только «Индекс легальности» — пороговая индикация самого значения (Deep Dive, табл. 4.1: ≥95 зелёный, 85–95 жёлтый, <85 красный). */
  valueTone?: 'ok' | 'warning' | 'critical';
  onClick?: () => void;
}

const VALUE_TONE_CLASS: Record<'ok' | 'warning' | 'critical', string> = {
  ok: 'text-status-ok',
  warning: 'text-status-warning',
  critical: 'text-status-blocked',
};

/** KPI-плашка стратегического слоя (на базе примитива `Card`) — значение + дельта + спарклайн (Deep Dive, разд. 4.1). */
export function KpiTile({ label, formattedValue, secondaryLabel, deltaPct, comparisonLabel, goodDirection, sparkline, valueTone, onClick }: KpiTileProps) {
  const isFlat = deltaPct === 0;
  const isUp = deltaPct > 0;
  const isGood = isFlat ? true : (isUp && goodDirection === 'up') || (!isUp && goodDirection === 'down');
  const deltaHex = isFlat ? '#94a3b8' : isGood ? statusColors.ok : statusColors.blocked;
  const deltaTextClass = isFlat ? 'text-navy-400' : isGood ? 'text-status-ok' : 'text-status-blocked';
  const DeltaIcon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const valueClass = valueTone ? VALUE_TONE_CLASS[valueTone] : 'text-orange-600';

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-navy-700">{label}</p>
        <span className={`flex shrink-0 items-center gap-0.5 text-xs font-semibold ${deltaTextClass}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {Math.abs(deltaPct)}%
        </span>
      </div>
      <p className={`text-3xl font-bold ${valueClass}`}>{formattedValue}</p>
      {secondaryLabel && <p className="-mt-2 text-xs text-navy-400">{secondaryLabel}</p>}
      <div className="flex items-end justify-between gap-2">
        <p className="text-[11px] text-navy-300">{comparisonLabel}</p>
        <Sparkline data={sparkline} color={deltaHex} />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardBaseClassName, 'text-left transition-shadow hover:shadow-md active:scale-[0.99]')}>
        {content}
      </button>
    );
  }

  return <Card>{content}</Card>;
}
