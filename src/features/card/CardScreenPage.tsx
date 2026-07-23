import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock4, CreditCard, ShieldCheck, X } from 'lucide-react';
import { CardMunai } from '@/components/ui/CardMunai';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { QrFullscreenModal } from '@/components/ui/QrFullscreenModal';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';
import { selectSessionCards } from '@/lib/sessionCards';

const QR_REFRESH_SECONDS = 30;

function formatResetTime(resetAt: string): string {
  return new Date(resetAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** S-18 — экран карты: QR, остаток лимита; заправка теперь запускается тапом по QR (ТЗ 5.0, 8.2, 8.3). */
export function CardScreenPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  const users = useUserStore((s) => s.users);
  const companies = useUserStore((s) => s.companies);
  const vehicles = useUserStore((s) => s.vehicles);
  const cards = useCardStore((s) => s.cards);
  const regenerateQrToken = useCardStore((s) => s.regenerateQrToken);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showIssuedBanner, setShowIssuedBanner] = useState(() => Boolean((location.state as { justIssued?: boolean } | null)?.justIssued));
  const [qrExpanded, setQrExpanded] = useState(false);

  const user = users.find((u) => u.id === currentUserId);
  const company = companies.find((c) => c.id === currentCompanyId);

  const myCards = useMemo(
    () => selectSessionCards({ cards, vehicles, currentUserId, currentCompanyId }),
    [cards, vehicles, currentUserId, currentCompanyId],
  );

  const activeCard = myCards.find((c) => c.id === selectedCardId) ?? myCards[0];

  useEffect(() => {
    if (!activeCard) return;
    const interval = setInterval(() => regenerateQrToken(activeCard.id), QR_REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [activeCard, regenerateQrToken]);

  if (!currentUserId && !currentCompanyId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm shadow-gray-200/60">
          <CreditCard className="h-7 w-7 text-gray-300" />
        </span>
        <p className="mt-4 text-sm text-gray-500">Нет активной сессии — сначала войдите или зарегистрируйтесь.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 active:scale-[0.97] transition-transform">
          На главную
        </button>
      </div>
    );
  }

  if (!activeCard) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm shadow-gray-200/60">
          <CreditCard className="h-7 w-7 text-gray-300" />
        </span>
        <p className="mt-4 text-sm text-gray-500">Активных карт не найдено.</p>
      </div>
    );
  }

  const holderName = company ? company.name : (user?.fio ?? '');
  const vehicle = activeCard.vehicleId ? vehicles.find((v) => v.id === activeCard.vehicleId) : undefined;
  const cardLabel = `${CARD_TYPE_LABEL[activeCard.cardType]}${vehicle ? ` · ${vehicle.grnz}` : ''}`;
  const remainingLabel = activeCard.dailyLimitL !== null ? `${Math.max(activeCard.dailyLimitL - activeCard.usedTodayL, 0)} л` : 'без лимита';

  return (
    <div className="space-y-5 p-4">
      {showIssuedBanner && (
        <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-gray-200/60 animate-sheet-rise-in">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-ok" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Карта успешно выпущена</p>
            <button type="button" onClick={() => navigate('/cabinet')} className="mt-2 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white active:scale-95 transition-transform">
              Перейти в кабинет
            </button>
          </div>
          <button type="button" onClick={() => setShowIssuedBanner(false)} aria-label="Закрыть" className="text-gray-300 hover:text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {myCards.length > 1 && (
        <div className="flex gap-1 rounded-full bg-gray-200/70 p-1">
          {myCards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCardId(c.id)}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                c.id === activeCard.id ? 'bg-white text-navy-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              {CARD_TYPE_LABEL[c.cardType]}
            </button>
          ))}
        </div>
      )}

      <CardMunai
        holderName={holderName}
        maskedIdentifier={activeCard.maskedIdentifier}
        cardLabel={cardLabel}
        qrToken={activeCard.qrToken}
        remainingLabel={remainingLabel}
        qrRefreshSeconds={QR_REFRESH_SECONDS}
        onExpandQr={() => setQrExpanded(true)}
      />

      <LimitProgressBar usedL={activeCard.usedTodayL} limitL={activeCard.dailyLimitL} />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <Clock4 className="h-4 w-4 shrink-0 text-gray-400" />
          <p className="flex-1 text-xs text-gray-500">Сброс лимита</p>
          <p className="text-xs font-medium tabular-nums text-gray-700">{formatResetTime(activeCard.resetAt)} · Астана</p>
        </div>
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-gray-400" />
            <p className="flex-1 text-xs text-gray-500">Цена в пределах лимита</p>
            <p className="text-xs font-medium text-gray-700">{activeCard.priceEligible ? 'Льготная' : 'Предельная'}</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">Нажмите на QR-код на карте, чтобы предъявить его на АЗС</p>

      <QrFullscreenModal
        open={qrExpanded}
        onClose={() => setQrExpanded(false)}
        cardId={activeCard.id}
        qrToken={activeCard.qrToken}
        holderName={holderName}
        maskedIdentifier={activeCard.maskedIdentifier}
        qrRefreshSeconds={QR_REFRESH_SECONDS}
      />
    </div>
  );
}
