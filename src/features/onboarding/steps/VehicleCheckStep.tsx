import { useEffect, useState } from 'react';
import type { VehicleCategory } from '@/types/entities';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { checkMvdRegistry } from '@/mocks/api';

export interface VehicleCheckResult {
  category: VehicleCategory;
  vehicle?: { grnz: string; category: VehicleCategory };
}

interface Props {
  /** ИИН/номер паспорта — единый идентификатор запроса к базе МВД. */
  identifier: string;
  onComplete: (result: VehicleCheckResult) => void;
}

/** S-08 — единый запрос к базе МВД: ТС на пользователе и/или полис ОГПО одним ответом (ТЗ 4.1–4.5). */
export function VehicleCheckStep({ identifier, onComplete }: Props) {
  const [steps, setSteps] = useState<StepperStep[]>([{ id: 'mvd', label: 'Проверка в базе МВД (ТС и страховка ОГПО)', status: 'in_progress' }]);
  const [failed, setFailed] = useState(false);

  const runCheck = () => {
    setFailed(false);
    setSteps([{ id: 'mvd', label: 'Проверка в базе МВД (ТС и страховка ОГПО)', status: 'in_progress' }]);
    checkMvdRegistry(identifier).then((res) => {
      if (res.status === 'error') {
        setSteps([{ id: 'mvd', label: 'Проверка в базе МВД', status: 'error', detail: res.message }]);
        setFailed(true);
        return;
      }
      setSteps([{ id: 'mvd', label: 'Проверка в базе МВД', status: 'success' }]);
      const { vehicle } = res.data;
      onComplete(vehicle ? { category: vehicle.category, vehicle } : { category: 'passenger' });
    });
  };

  useEffect(() => {
    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  return (
    <div className="space-y-4">
      <StepperStatus steps={steps} />
      {failed && (
        <button type="button" onClick={runCheck} className="w-full rounded-xl border border-navy-300 py-3 font-semibold text-navy-700">
          Повторить проверку
        </button>
      )}
    </div>
  );
}
