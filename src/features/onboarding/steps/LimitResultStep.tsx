import { CheckCircle2 } from 'lucide-react';
import type { CardType } from '@/types/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CARD_TYPE_LABEL } from '@/lib/cardLabels';

export interface ResultCardSpec {
  cardType: CardType;
  dailyLimitL: number | null;
  priceEligible: boolean;
}

interface Props {
  specs: ResultCardSpec[];
  onContinue: () => void;
}

/** S-09 — итоговая карточка(и): категория ТС и определённый лимит по каждой выпускаемой карте (ТЗ 4.1–4.5, S-10 — «1–2 карты, если несколько категорий ТС»). */
export function LimitResultStep({ specs, onContinue }: Props) {
  return (
    <div className="space-y-6">
      {specs.length > 1 && <p className="text-center text-sm text-gray-500">На вас будет выпущено {specs.length} карты — по одной на каждую категорию ТС</p>}
      <div className="space-y-3">
        {specs.map((spec, i) => (
          <Card key={i} className="items-center text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-status-ok" />
            <p className="text-sm text-gray-500">{CARD_TYPE_LABEL[spec.cardType]}</p>
            <p className="text-2xl font-bold text-gray-900">{spec.dailyLimitL !== null ? `${spec.dailyLimitL} л/сутки` : 'без лимита'}</p>
            <p className="text-xs text-gray-400">
              {spec.priceEligible ? 'Льготная цена в пределах суточного лимита' : 'Льготный лимит не применяется — отпуск по предельной цене'}
            </p>
          </Card>
        ))}
      </div>
      <Button type="button" onClick={onContinue} className="w-full">
        {specs.length > 1 ? 'Выпустить карты' : 'Выпустить карту'}
      </Button>
    </div>
  );
}
