import type { GapCounterparty } from '@/mocks/seed';
import { chartCategorical } from '@/theme/colors';
import { tonsToLitersAvg } from '@/lib/fuelDensity';

interface GapByCounterpartyListProps {
  counterparties: GapCounterparty[];
  /** Реальный разрыв «закуп СУНП минус факт JanarmAI» за выбранный период, т (см. `computeSunpReconciliation`) — распределяется по долям контрагентов, чтобы разбивка не расходилась с показателями «Реализация СУНП»/«Факт JanarmAI» выше на дашборде. */
  totalGapT: number;
}

/** Разложение разрыва «закуп СУНП vs факт» по топ-5 контрагентам/сетям (Deep Dive 4.2, кейс Кении). Плотность усреднённая — у виджета нет разреза по марке топлива (см. OPEN_QUESTIONS.md). */
export function GapByCounterpartyList({ counterparties, totalGapT }: GapByCounterpartyListProps) {
  return (
    <div>
      <p className="mb-3 text-[11px] leading-snug text-navy-400">
        Разница «реализация по СУНП минус факт JanarmAI» ({Math.round(totalGapT).toLocaleString('ru-RU')} т за период) разложена по 5 контрагентам/сетям, которые дают
        в неё наибольший вклад — «т» это объём разрыва именно этого контрагента, «%» — его доля в этой разнице (5 строк ниже в сумме дают ~100%).
      </p>
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-wide text-navy-300 uppercase">
        <span>Контрагент / сеть</span>
        <span>Объём разрыва · доля от разрыва топ-5</span>
      </div>
      <ol className="space-y-3">
        {counterparties.map((c, i) => {
          const gapT = (totalGapT * c.gapSharePct) / 100;
          const gapL = tonsToLitersAvg(gapT);
          return (
            <li key={c.name}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-navy-700">
                    #{i + 1} {c.name}
                  </span>
                  {i === 0 && (
                    <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">наибольшее расхождение</span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-navy-400">
                  {gapT.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} т
                  <span className="text-navy-300"> · {Math.round(gapL).toLocaleString('ru-RU')} л</span> · {c.gapSharePct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-navy-50">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.gapSharePct}%`, backgroundColor: i === 0 ? chartCategorical.orange : chartCategorical.navy }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
