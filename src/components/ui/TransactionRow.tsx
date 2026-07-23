import { Fuel } from 'lucide-react';
import type { Transaction } from '@/types/entities';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

export interface TransactionRowProps {
  transaction: Transaction;
  /** Тип использованной карты либо ГРНЗ/водитель — контекст зависит от кабинета ФЛ/ЮЛ (8.4). */
  cardLabel: string;
}

/**
 * Строка истории заправки — слева иконка+дата/АЗС, справа топливо/литры (акцент), ниже — карта/ТС (ТЗ 8.4).
 * Без собственной карточки/тени — используется внутри `TransactionListGroup` (iOS grouped-list паттерн).
 */
export function TransactionRow({ transaction, cardLabel }: TransactionRowProps) {
  const date = new Date(transaction.dateTime);
  const dateLabel = date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50">
        <Fuel className="h-4 w-4 text-navy-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{transaction.stationName}</p>
        <p className="text-xs tabular-nums text-gray-400">{dateLabel}</p>
        <p className="mt-0.5 text-xs text-gray-400">{cardLabel}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold tabular-nums text-orange-600">
          {transaction.volumeL} л · {FUEL_TYPE_LABEL[transaction.fuelType]}
        </p>
        <p className="text-xs text-gray-400">{transaction.priceType === 'preferential' ? 'льготная цена' : 'предельная цена'}</p>
        <p className="text-xs tabular-nums text-gray-400">{transaction.totalKzt.toLocaleString('ru-RU')} ₸</p>
      </div>
    </div>
  );
}
