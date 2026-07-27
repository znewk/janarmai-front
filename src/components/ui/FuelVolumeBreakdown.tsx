import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { FuelVolumeBreakdownItem } from '@/lib/analyticsCompute';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

/** Разбивка по маркам топлива (АИ-92/95/98/ДТ), тонны + дельта к прошлому периоду — главный показатель №1 (по замечанию ПМ). */
export function FuelVolumeBreakdown({ items }: { items: FuelVolumeBreakdownItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const DeltaIcon = item.deltaPct === 0 ? Minus : item.deltaPct > 0 ? ArrowUpRight : ArrowDownRight;
        const deltaClass = item.deltaPct === 0 ? 'text-navy-400' : item.deltaPct > 0 ? 'text-status-ok' : 'text-status-blocked';
        return (
          <li key={item.fuelType} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-navy-700">{FUEL_TYPE_LABEL[item.fuelType]}</span>
            <div className="flex items-center gap-3">
              <span className="text-right text-sm text-navy-400">{Math.round(item.volumeL).toLocaleString('ru-RU')} л</span>
              <span className="w-20 text-right text-base font-bold tabular-nums text-navy-900">
                {item.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т
              </span>
              <span className={`flex w-14 shrink-0 items-center justify-end gap-0.5 text-xs font-semibold ${deltaClass}`}>
                <DeltaIcon className="h-3 w-3" />
                {Math.abs(item.deltaPct)}%
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
