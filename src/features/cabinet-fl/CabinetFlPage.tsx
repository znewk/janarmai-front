import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardMunai } from '@/components/ui/CardMunai';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { selectSessionCards } from '@/lib/sessionCards';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';

/** S-22 — кабинет ФЛ: карта(ы), прогресс-бар лимита по каждой, последние заправки (ТЗ 5.1). */
export function CabinetFlPage() {
  const navigate = useNavigate();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const users = useUserStore((s) => s.users);
  const vehicles = useUserStore((s) => s.vehicles);
  const cards = useCardStore((s) => s.cards);
  const transactions = useTransactionStore((s) => s.transactions);
  const logout = useUserStore((s) => s.logout);

  const user = users.find((u) => u.id === currentUserId);

  const myCards = useMemo(
    () => selectSessionCards({ cards, vehicles, currentUserId, currentCompanyId: null }),
    [cards, vehicles, currentUserId],
  );
  const myCardIds = myCards.map((c) => c.id);

  const recentTransactions = useMemo(
    () =>
      transactions
        .filter((t) => myCardIds.includes(t.cardId))
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice(0, 5),
    [transactions, myCardIds],
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-status-blocked">Нет активной сессии — сначала войдите или зарегистрируйтесь.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-navy-400">Личный кабинет</p>
          <h1 className="text-lg font-bold text-navy-900">{user.fio}</h1>
        </div>
        <button type="button" onClick={handleLogout} className="text-xs font-semibold text-navy-500">
          Выйти
        </button>
      </div>

      <div className="space-y-4">
        {myCards.map((card) => (
          <div key={card.id} className="space-y-2">
            <CardMunai
              holderName={user.fio}
              maskedIdentifier={card.maskedIdentifier}
              cardLabel={CARD_TYPE_LABEL[card.cardType]}
              qrToken={card.qrToken}
              remainingLabel={card.dailyLimitL !== null ? `${Math.max(card.dailyLimitL - card.usedTodayL, 0)} л` : 'без лимита'}
            />
            <LimitProgressBar usedL={card.usedTodayL} limitL={card.dailyLimitL} />
          </div>
        ))}
        {myCards.length === 0 && <p className="text-sm text-navy-400">Активных карт нет.</p>}
      </div>

      <button type="button" onClick={() => navigate('/card')} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
        Карта / Симулировать заправку
      </button>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-700">Последние заправки</h2>
          <button type="button" onClick={() => navigate('/cabinet/history')} className="text-xs font-semibold text-navy-500">
            Вся история →
          </button>
        </div>
        <div className="space-y-2">
          {recentTransactions.map((t) => {
            const card = myCards.find((c) => c.id === t.cardId);
            return <TransactionRow key={t.id} transaction={t} cardLabel={card ? CARD_TYPE_LABEL[card.cardType] : ''} />;
          })}
          {recentTransactions.length === 0 && <p className="text-sm text-navy-400">Заправок пока не было.</p>}
        </div>
      </div>
    </div>
  );
}
