import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw } from 'lucide-react';
import { CardMunai } from '@/components/ui/CardMunai';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { TransactionRow } from '@/components/ui/TransactionRow';
import { QrFullscreenModal } from '@/components/ui/QrFullscreenModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { selectSessionCards } from '@/lib/sessionCards';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';
import { getInitials } from '@/lib/initials';
import { resetDemoData } from '@/store';

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
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const myCards = useMemo(
    () => selectSessionCards({ cards, vehicles, currentUserId, currentCompanyId: null }),
    [cards, vehicles, currentUserId],
  );
  const myCardIds = myCards.map((c) => c.id);
  const expandedCard = myCards.find((c) => c.id === expandedCardId);

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

  const handleReset = () => {
    resetDemoData();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-status-blocked">Нет активной сессии — сначала войдите или зарегистрируйтесь.</p>
        <Button type="button" onClick={() => navigate('/')} className="mt-4">
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-sm font-semibold text-white shadow-sm shadow-navy-900/20">
            {getInitials(user.fio)}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Личный кабинет</p>
            <h1 className="truncate text-lg font-bold text-gray-900">{user.fio}</h1>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout} className="shrink-0 rounded-full">
          <LogOut className="h-3.5 w-3.5" />
          Выйти
        </Button>
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
              onExpandQr={() => setExpandedCardId(card.id)}
            />
            <LimitProgressBar usedL={card.usedTodayL} limitL={card.dailyLimitL} />
          </div>
        ))}
        {myCards.length === 0 && <p className="text-sm text-gray-400">Активных карт нет.</p>}
      </div>

      <Button type="button" size="lg" onClick={() => navigate('/card')} className="w-full">
        Карта и QR-код
      </Button>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Последние заправки</h2>
          <Button type="button" variant="link" size="sm" onClick={() => navigate('/cabinet/history')} className="h-auto p-0">
            Вся история →
          </Button>
        </div>
        {recentTransactions.length > 0 ? (
          <Card className="gap-0 divide-y divide-gray-100 overflow-hidden p-0">
            {recentTransactions.map((t) => {
              const card = myCards.find((c) => c.id === t.cardId);
              return <TransactionRow key={t.id} transaction={t} cardLabel={card ? CARD_TYPE_LABEL[card.cardType] : ''} />;
            })}
          </Card>
        ) : (
          <Card>
            <p className="text-center text-sm text-gray-400">Заправок пока не было.</p>
          </Card>
        )}
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="w-full text-gray-400">
        <RotateCcw className="h-3.5 w-3.5" />
        Сбросить демо-данные
      </Button>

      {expandedCard && (
        <QrFullscreenModal
          open={!!expandedCard}
          onClose={() => setExpandedCardId(null)}
          cardId={expandedCard.id}
          qrToken={expandedCard.qrToken}
          holderName={user.fio}
          maskedIdentifier={expandedCard.maskedIdentifier}
        />
      )}
    </div>
  );
}
