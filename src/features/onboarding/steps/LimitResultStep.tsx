import { CheckCircle2 } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';

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
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-gray-200/60">
        <CheckCircle2 className="mx-auto h-8 w-8 text-status-ok" />
        <p className="mt-2 text-sm text-gray-500">Категория ТС: {CATEGORY_LABEL[category]}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{dailyLimitL !== null ? `${dailyLimitL} л/сутки` : 'без лимита'}</p>
        <p className="mt-1 text-xs text-gray-400">
          {priceEligible ? 'Льготная цена в пределах суточного лимита' : 'Льготный лимит не применяется — отпуск по предельной цене'}
        </p>
      </div>
      <button type="button" onClick={onContinue} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30">
        Выпустить карту
      </button>
    </div>
  );
}
