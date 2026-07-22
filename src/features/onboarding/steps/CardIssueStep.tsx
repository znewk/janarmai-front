import type { Card } from '@/types/entities';
import { CardMunai } from '@/components/ui/CardMunai';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';

interface Props {
  holderName: string;
  cards: Card[];
  onContinue: () => void;
}

/** S-10 — финальный экран регистрации: выпуск карты(карт), переход в личный кабинет (ТЗ 4.1–4.5). */
export function CardIssueStep({ holderName, cards, onContinue }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg font-bold text-navy-900">Карта{cards.length > 1 ? 'ы' : ''} выпущена{cards.length > 1 ? 'ы' : ''}</p>
        <p className="mt-1 text-sm text-navy-500">Добро пожаловать в JanarmAI, {holderName}</p>
      </div>
      <div className="space-y-3">
        {cards.map((card) => (
          <CardMunai
            key={card.id}
            holderName={holderName}
            maskedIdentifier={card.maskedIdentifier}
            cardLabel={CARD_TYPE_LABEL[card.cardType]}
            qrToken={card.qrToken}
            remainingLabel={card.dailyLimitL !== null ? `${card.dailyLimitL - card.usedTodayL} л` : 'без лимита'}
          />
        ))}
      </div>
      <button type="button" onClick={onContinue} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
        Перейти в личный кабинет
      </button>
    </div>
  );
}
