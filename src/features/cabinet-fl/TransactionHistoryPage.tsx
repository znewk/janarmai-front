import { useMemo, useState } from 'react';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { FilterBar, type FilterDef } from '@/components/ui/FilterBar';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { selectSessionCards } from '@/lib/sessionCards';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

type Period = 'all' | '7d' | '30d';

/** S-23/S-25 — история заправок с фильтрами (период, карта/ТС, АЗС, вид топлива) — ФЛ и ЮЛ (ТЗ 5.1/5.2). */
export function TransactionHistoryPage() {
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  const vehicles = useUserStore((s) => s.vehicles);
  const drivers = useUserStore((s) => s.drivers);
  const cards = useCardStore((s) => s.cards);
  const transactions = useTransactionStore((s) => s.transactions);

  const [period, setPeriod] = useState<Period>('all');
  const [cardId, setCardId] = useState('all');
  const [driverId, setDriverId] = useState('all');
  const [stationId, setStationId] = useState('all');
  const [fuelType, setFuelType] = useState('all');

  const isUl = !!currentCompanyId;
  const myCards = useMemo(
    () => selectSessionCards({ cards, vehicles, currentUserId, currentCompanyId }),
    [cards, vehicles, currentUserId, currentCompanyId],
  );
  const myCardIds = myCards.map((c) => c.id);
  const companyVehicles = useMemo(() => (isUl ? vehicles.filter((v) => v.ownerId === currentCompanyId) : []), [isUl, vehicles, currentCompanyId]);
  const companyDrivers = useMemo(() => (isUl ? drivers.filter((d) => d.companyId === currentCompanyId) : []), [isUl, drivers, currentCompanyId]);

  const baseTransactions = useMemo(() => transactions.filter((t) => myCardIds.includes(t.cardId)), [transactions, myCardIds]);

  const stationOptions = useMemo(() => {
    const map = new Map<string, string>();
    baseTransactions.forEach((t) => map.set(t.stationId, t.stationName));
    return Array.from(map.entries());
  }, [baseTransactions]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = period === '7d' ? now - 7 * 86400000 : period === '30d' ? now - 30 * 86400000 : null;
    return baseTransactions
      .filter((t) => (cutoff === null ? true : new Date(t.dateTime).getTime() >= cutoff))
      .filter((t) => (cardId === 'all' ? true : t.cardId === cardId))
      .filter((t) => (stationId === 'all' ? true : t.stationId === stationId))
      .filter((t) => (fuelType === 'all' ? true : t.fuelType === fuelType))
      .filter((t) => {
        if (driverId === 'all') return true;
        const card = myCards.find((c) => c.id === t.cardId);
        const vehicle = card?.vehicleId ? companyVehicles.find((v) => v.id === card.vehicleId) : undefined;
        return vehicle?.driverId === driverId;
      })
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [baseTransactions, period, cardId, stationId, fuelType, driverId, myCards, companyVehicles]);

  const filters: FilterDef[] = [
    {
      label: 'Период',
      value: period,
      onChange: (v) => setPeriod(v as Period),
      options: [
        { value: 'all', label: 'Весь период' },
        { value: '7d', label: '7 дней' },
        { value: '30d', label: '30 дней' },
      ],
    },
    {
      label: isUl ? 'ТС' : 'Карта',
      value: cardId,
      onChange: setCardId,
      options: [
        { value: 'all', label: isUl ? 'Все ТС' : 'Все карты' },
        ...myCards.map((c) => {
          const vehicle = c.vehicleId ? companyVehicles.find((v) => v.id === c.vehicleId) : undefined;
          return { value: c.id, label: vehicle ? `${vehicle.grnz} · ${CARD_TYPE_LABEL[c.cardType]}` : CARD_TYPE_LABEL[c.cardType] };
        }),
      ],
    },
    {
      label: 'АЗС',
      value: stationId,
      onChange: setStationId,
      options: [{ value: 'all', label: 'Все АЗС' }, ...stationOptions.map(([id, name]) => ({ value: id, label: name }))],
    },
    {
      label: 'Топливо',
      value: fuelType,
      onChange: setFuelType,
      options: [
        { value: 'all', label: 'Всё топливо' },
        { value: 'ai92', label: FUEL_TYPE_LABEL.ai92 },
        { value: 'ai95', label: FUEL_TYPE_LABEL.ai95 },
        { value: 'dt', label: FUEL_TYPE_LABEL.dt },
      ],
    },
  ];

  if (isUl) {
    filters.push({
      label: 'Водитель',
      value: driverId,
      onChange: setDriverId,
      options: [{ value: 'all', label: 'Все водители' }, ...companyDrivers.map((d) => ({ value: d.id, label: d.fio }))],
    });
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-gray-900">История заправок</h1>

      <FilterBar filters={filters} />

      {filtered.length > 0 ? (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          {filtered.map((t) => {
            const card = myCards.find((c) => c.id === t.cardId);
            const vehicle = card?.vehicleId ? companyVehicles.find((v) => v.id === card.vehicleId) : undefined;
            const driver = vehicle?.driverId ? companyDrivers.find((d) => d.id === vehicle.driverId) : undefined;
            const label = vehicle ? `${vehicle.grnz}${driver ? ` · ${driver.fio}` : ''}` : card ? CARD_TYPE_LABEL[card.cardType] : '';
            return <TransactionRow key={t.id} transaction={t} cardLabel={label} />;
          })}
        </div>
      ) : (
        <p className="rounded-2xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm shadow-gray-200/60">Нет заправок по выбранным фильтрам.</p>
      )}
    </div>
  );
}
