import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Clock3, FileDown, Truck, QrCode } from 'lucide-react';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { selectSessionCards } from '@/lib/sessionCards';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { exportFleetReportCsv } from '@/features/cabinet-ul/exportReport';
import { getInitials } from '@/lib/initials';

interface QuickAction {
  icon: typeof Fuel;
  label: string;
  color: 'navy' | 'orange';
  onClick: () => void;
}

/** Главная вкладка — сводка по лимиту, быстрые действия, недавние операции (редизайн в духе eGov Mobile 3.0). */
export function HomePage() {
  const navigate = useNavigate();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  const users = useUserStore((s) => s.users);
  const companies = useUserStore((s) => s.companies);
  const vehicles = useUserStore((s) => s.vehicles);
  const drivers = useUserStore((s) => s.drivers);
  const cards = useCardStore((s) => s.cards);
  const transactions = useTransactionStore((s) => s.transactions);

  const isUl = !!currentCompanyId;
  const user = users.find((u) => u.id === currentUserId);
  const company = companies.find((c) => c.id === currentCompanyId);

  const myCards = useMemo(
    () => selectSessionCards({ cards, vehicles, currentUserId, currentCompanyId }),
    [cards, vehicles, currentUserId, currentCompanyId],
  );
  const myCardIds = myCards.map((c) => c.id);

  const totals = useMemo(() => {
    const withLimit = myCards.filter((c) => c.dailyLimitL !== null);
    const usedL = withLimit.reduce((sum, c) => sum + c.usedTodayL, 0);
    const limitL = withLimit.reduce((sum, c) => sum + (c.dailyLimitL ?? 0), 0);
    const remainingL = Math.max(limitL - usedL, 0);
    return { usedL, limitL, remainingL, hasLimit: withLimit.length > 0 };
  }, [myCards]);

  const recentTransactions = useMemo(
    () =>
      transactions
        .filter((t) => myCardIds.includes(t.cardId))
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice(0, 3),
    [transactions, myCardIds],
  );

  if (!currentUserId && !currentCompanyId) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-500">Нет активной сессии — сначала войдите или зарегистрируйтесь.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          На главную
        </button>
      </div>
    );
  }

  const displayName = isUl ? company?.name : user?.fio;
  const firstName = !isUl && user ? user.fio.split(' ')[1] || user.fio.split(' ')[0] : null;

  const quickActions: QuickAction[] = [
    { icon: QrCode, label: 'Карта / QR', color: 'navy', onClick: () => navigate('/card') },
    { icon: Clock3, label: 'История', color: 'navy', onClick: () => navigate('/cabinet/history') },
    ...(isUl
      ? ([
          { icon: Truck, label: 'Автопарк', color: 'orange', onClick: () => navigate('/cabinet') },
          {
            icon: FileDown,
            label: 'Отчёт',
            color: 'orange',
            onClick: () => {
              if (!company) return;
              const fleetCardIds = myCardIds;
              exportFleetReportCsv({
                companyName: company.name,
                transactions: transactions.filter((t) => fleetCardIds.includes(t.cardId)),
                cards,
                vehicles,
                drivers,
              });
            },
          },
        ] as QuickAction[])
      : []),
  ];

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-sm font-semibold text-white shadow-sm shadow-navy-900/20">
          {getInitials(displayName ?? '')}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-gray-400">Здравствуйте{firstName ? `, ${firstName}` : ''}!</p>
          <h1 className="truncate text-xl font-bold text-gray-900">{displayName}</h1>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-700 to-navy-950 p-5 text-white shadow-md">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-10 h-20 w-20 rounded-full bg-orange-500/20" />
        <div className="relative">
          <p className="text-xs text-navy-200">Остаток лимита на сегодня</p>
          {totals.hasLimit ? (
            <>
              <p className="mt-1 text-3xl font-bold text-orange-400">{totals.remainingL} л</p>
              <p className="mt-1 text-xs text-navy-300">
                Использовано {totals.usedL} из {totals.limitL} л
              </p>
            </>
          ) : (
            <p className="mt-1 text-2xl font-bold text-orange-400">без лимита</p>
          )}
          <button
            type="button"
            onClick={() => navigate('/card')}
            className="mt-4 flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            <Fuel className="h-4 w-4" />
            Показать QR для заправки
          </button>
        </div>
      </div>

      <div className={`grid gap-3 ${quickActions.length > 2 ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {quickActions.map(({ icon: Icon, label, color, onClick }) => (
          <button key={label} type="button" onClick={onClick} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center shadow-sm shadow-gray-200/60">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${color === 'navy' ? 'bg-navy-600' : 'bg-orange-500'}`}>
              <Icon className="h-5 w-5 text-white" />
            </span>
            <span className="text-xs font-medium text-gray-600">{label}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Последние заправки</h2>
          <button type="button" onClick={() => navigate('/cabinet/history')} className="text-xs font-semibold text-navy-600">
            Все →
          </button>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
            {recentTransactions.map((t) => {
              const card = myCards.find((c) => c.id === t.cardId);
              const vehicle = card?.vehicleId ? vehicles.find((v) => v.id === card.vehicleId) : undefined;
              const label = vehicle ? `${vehicle.grnz}` : card ? CARD_TYPE_LABEL[card.cardType] : '';
              return <TransactionRow key={t.id} transaction={t} cardLabel={label} />;
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm shadow-gray-200/60">Заправок пока не было</p>
        )}
      </div>
    </div>
  );
}
