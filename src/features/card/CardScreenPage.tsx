import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, FuelType } from '@/types/entities';
import { CardMunai } from '@/components/ui/CardMunai';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { FuelingParamsStep } from './FuelingParamsStep';
import { FuelingProcessStep } from './FuelingProcessStep';
import type { FuelingResult } from './fuelingActions';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { showToast } from '@/components/ui/toastStore';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

const QR_REFRESH_SECONDS = 30;

const CARD_TYPE_LABEL: Record<Card['cardType'], string> = {
  fl_person: 'ФЛ · персональная',
  fl_passenger: 'ФЛ · легковая',
  fl_truck: 'ФЛ · грузовая',
  ul_passenger: 'ЮЛ · легковая',
  ul_truck: 'ЮЛ · грузовая',
};

type SimStep = 'idle' | 'params' | 'processing';

/** S-18 — экран карты: QR, остаток лимита, кнопка «Симулировать заправку» (ТЗ 5.0, 8.2, 8.3). */
export function CardScreenPage() {
  const navigate = useNavigate();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  const users = useUserStore((s) => s.users);
  const companies = useUserStore((s) => s.companies);
  const vehicles = useUserStore((s) => s.vehicles);
  const cards = useCardStore((s) => s.cards);
  const regenerateQrToken = useCardStore((s) => s.regenerateQrToken);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [simStep, setSimStep] = useState<SimStep>('idle');
  const [fuelingParams, setFuelingParams] = useState<{ fuelType: FuelType; volumeL: number } | null>(null);

  const user = users.find((u) => u.id === currentUserId);
  const company = companies.find((c) => c.id === currentCompanyId);

  const myCards = useMemo(() => {
    if (currentCompanyId) {
      const vehicleIds = vehicles.filter((v) => v.ownerId === currentCompanyId).map((v) => v.id);
      return cards.filter((c) => c.vehicleId && vehicleIds.includes(c.vehicleId) && c.active);
    }
    if (currentUserId) {
      const vehicleIds = vehicles.filter((v) => v.ownerKind === 'user' && v.ownerId === currentUserId).map((v) => v.id);
      return cards.filter((c) => (c.userId === currentUserId || (c.vehicleId && vehicleIds.includes(c.vehicleId))) && c.active);
    }
    return [];
  }, [cards, vehicles, currentUserId, currentCompanyId]);

  const activeCard = myCards.find((c) => c.id === selectedCardId) ?? myCards[0];

  useEffect(() => {
    if (!activeCard) return;
    const interval = setInterval(() => regenerateQrToken(activeCard.id), QR_REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [activeCard, regenerateQrToken]);

  if (!currentUserId && !currentCompanyId) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-navy-500">Нет активной сессии — сначала войдите или зарегистрируйтесь.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          На главную
        </button>
      </div>
    );
  }

  if (!activeCard) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-navy-500">Активных карт не найдено.</p>
      </div>
    );
  }

  const holderName = company ? company.name : (user?.fio ?? '');
  const vehicle = activeCard.vehicleId ? vehicles.find((v) => v.id === activeCard.vehicleId) : undefined;
  const cardLabel = `${CARD_TYPE_LABEL[activeCard.cardType]}${vehicle ? ` · ${vehicle.grnz}` : ''}`;
  const remainingLabel = activeCard.dailyLimitL !== null ? `${Math.max(activeCard.dailyLimitL - activeCard.usedTodayL, 0)} л` : 'без лимита';
  const suggestedVolumeL = activeCard.dailyLimitL ? Math.max(Math.round(activeCard.dailyLimitL * 0.4), 5) : 40;

  const handleFuelingComplete = (result: FuelingResult) => {
    setSimStep('idle');
    setFuelingParams(null);
    const priceLabel = result.transaction.priceType === 'preferential' ? 'льготная цена' : 'предельная цена';
    showToast({
      variant: 'success',
      message: `Заправка подтверждена: ${result.transaction.volumeL} л ${FUEL_TYPE_LABEL[result.transaction.fuelType]}`,
      description: `${priceLabel} · остаток ${result.remainingL !== null ? `${result.remainingL} л` : 'без лимита'}`,
    });
    if (result.warningThresholdReached) {
      showToast({ variant: 'warning', message: 'Достигнуто 80% суточного лимита' });
    }
  };

  return (
    <div className="space-y-5 p-4">
      {myCards.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {myCards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCardId(c.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                c.id === activeCard.id ? 'border-navy-600 bg-navy-600 text-white' : 'border-navy-200 text-navy-600'
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
      />

      <LimitProgressBar usedL={activeCard.usedTodayL} limitL={activeCard.dailyLimitL} />

      {simStep === 'idle' && (
        <button type="button" onClick={() => setSimStep('params')} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
          Симулировать заправку
        </button>
      )}

      {simStep === 'params' && (
        <FuelingParamsStep
          suggestedVolumeL={suggestedVolumeL}
          onCancel={() => setSimStep('idle')}
          onStart={(params) => {
            setFuelingParams(params);
            setSimStep('processing');
          }}
        />
      )}

      {simStep === 'processing' && fuelingParams && (
        <FuelingProcessStep cardId={activeCard.id} fuelType={fuelingParams.fuelType} volumeL={fuelingParams.volumeL} onComplete={handleFuelingComplete} />
      )}
    </div>
  );
}
