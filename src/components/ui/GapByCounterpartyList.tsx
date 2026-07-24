import type { GapCounterparty } from '@/mocks/seed';
import { chartCategorical } from '@/theme/colors';

/** Разложение разрыва «Закуп vs Реализация» по топ-5 контрагентам/сетям — не только общий агрегат (Deep Dive 4.2, кейс Кении). */
export function GapByCounterpartyList({ counterparties }: { counterparties: GapCounterparty[] }) {
  const maxShare = Math.max(...counterparties.map((c) => c.gapSharePct));
  return (
    <ol className="space-y-3">
      {counterparties.map((c, i) => (
        <li key={c.name}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-navy-700">
              #{i + 1} {c.name}
            </span>
            <span className="shrink-0 tabular-nums text-navy-400">
              {c.gapVolumeL.toLocaleString('ru-RU')} л · {c.gapSharePct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-navy-50">
            <div
              className="h-full rounded-full"
              style={{ width: `${(c.gapSharePct / maxShare) * 100}%`, backgroundColor: i === 0 ? chartCategorical.orange : chartCategorical.navy }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
