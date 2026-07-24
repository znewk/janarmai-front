import { CheckCircle2 } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CATEGORY_LABEL: Record<VehicleCategory, string> = { passenger: 'легковая', truck: 'грузовая' };

interface Props {
  category: VehicleCategory;
  dailyLimitL: number | null;
  priceEligible: boolean;
  onContinue: () => void;
}

/** S-09 — итоговая карточка: категория ТС и определённый лимит (ТЗ 4.1–4.5). */
export function LimitResultStep({ category, dailyLimitL, priceEligible, onContinue }: Props) {
  return (
    <div className="space-y-6">
      <Card className="items-center text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-status-ok" />
        <p className="text-sm text-gray-500">Категория ТС: {CATEGORY_LABEL[category]}</p>
        <p className="text-2xl font-bold text-gray-900">{dailyLimitL !== null ? `${dailyLimitL} л/сутки` : 'без лимита'}</p>
        <p className="text-xs text-gray-400">
          {priceEligible ? 'Льготная цена в пределах суточного лимита' : 'Льготный лимит не применяется — отпуск по предельной цене'}
        </p>
      </Card>
      <Button type="button" onClick={onContinue} className="w-full">
        Выпустить карту
      </Button>
    </div>
  );
}
