import type { Transaction } from '@/types/entities';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

export interface TransactionRowProps {
  transaction: Transaction;
  /** Тип использованной карты либо ГРНЗ/водитель — контекст зависит от кабинета ФЛ/ЮЛ (8.4). */
  cardLabel: string;
}

/** Строка истории заправки: слева дата/АЗС (приглушённо), справа топливо/литры (акцент), ниже — карта/ТС (ТЗ 8.4). */
export function TransactionRow({ transaction, cardLabel }: TransactionRowProps) {
  const date = new Date(transaction.dateTime);
  const dateLabel = date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start justify-between rounded-xl border border-navy-100 p-3">
      <div className="min-w-0">
        <p className="text-sm text-navy-400">{dateLabel}</p>
        <p className="truncate text-sm text-navy-500">{transaction.stationName}</p>
        <p className="mt-1 text-xs text-navy-400">{cardLabel}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-orange-600">
          {transaction.volumeL} л · {FUEL_TYPE_LABEL[transaction.fuelType]}
        </p>
        <p className="text-xs text-navy-400">{transaction.priceType === 'preferential' ? 'льготная цена' : 'предельная цена'}</p>
        <p className="text-xs text-navy-400">{transaction.totalKzt.toLocaleString('ru-RU')} ₸</p>
      </div>
    </div>
  );
}
