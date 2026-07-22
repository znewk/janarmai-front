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
      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-status-ok" />
        <p className="mt-2 text-sm text-navy-500">Категория ТС: {CATEGORY_LABEL[category]}</p>
        <p className="mt-1 text-2xl font-bold text-navy-900">{dailyLimitL !== null ? `${dailyLimitL} л/сутки` : 'без лимита'}</p>
        <p className="mt-1 text-xs text-navy-400">
          {priceEligible ? 'Льготная цена в пределах суточного лимита' : 'Льготный лимит не применяется — отпуск по предельной цене'}
        </p>
      </div>
      <button type="button" onClick={onContinue} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
        Выпустить карту
      </button>
    </div>
  );
}
