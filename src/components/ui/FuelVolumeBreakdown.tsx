import { Fuel, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { FuelVolumeBreakdownItem } from '@/lib/analyticsCompute';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

/** Big-number плитки по маркам топлива (АИ-92/95/98/ДТ), тонны — главный показатель №1 (по замечанию ПМ). */
export function FuelVolumeBreakdown({ items }: { items: FuelVolumeBreakdownItem[] }) {
  const totalT = items.reduce((s, i) => s + i.volumeT, 0);
  const totalL = items.reduce((s, i) => s + i.volumeL, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const DeltaIcon = item.deltaPct === 0 ? Minus : item.deltaPct > 0 ? ArrowUpRight : ArrowDownRight;
          const deltaClass = item.deltaPct === 0 ? 'text-navy-400' : item.deltaPct > 0 ? 'text-status-ok' : 'text-status-blocked';
          const sharePct = totalT > 0 ? Math.round((item.volumeT / totalT) * 1000) / 10 : 0;
          return (
            <div key={item.fuelType} className="rounded-2xl bg-navy-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-600">
                    <Fuel className="h-3.5 w-3.5 text-white" />
                  </span>
                  {FUEL_TYPE_LABEL[item.fuelType]}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${deltaClass}`}>
                  <DeltaIcon className="h-3.5 w-3.5" />
                  {Math.abs(item.deltaPct)}%
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-navy-900">
                {item.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <span className="ml-1 text-base font-semibold text-navy-400">т</span>
              </p>
              <p className="text-xs text-navy-400">{Math.round(item.volumeL).toLocaleString('ru-RU')} л</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                <div className="h-full rounded-full bg-navy-500" style={{ width: `${sharePct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-navy-400">{sharePct}% от общего объёма</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-navy-200 p-4">
        <span className="text-xs font-semibold tracking-wide text-navy-500 uppercase">Итого по всем маркам</span>
        <span className="text-right">
          <span className="text-xl font-bold tabular-nums text-navy-900">
            {totalT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т
          </span>
          <span className="ml-2 text-xs text-navy-400">{Math.round(totalL).toLocaleString('ru-RU')} л</span>
        </span>
      </div>
    </div>
  );
}
