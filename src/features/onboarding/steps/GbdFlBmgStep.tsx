import { useEffect, useState } from 'react';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { Button } from '@/components/ui/button';
import { checkGbdFl, checkBmg } from '@/mocks/api';

interface Props {
  iin: string;
  fio: string;
  phone: string;
  onSuccess: () => void;
  onRetry: () => void;
}

/** S-05 — степпер проверки ГБД ФЛ / БМГ (полный путь КМГ, ТЗ 4.2). */
export function GbdFlBmgStep({ iin, fio, phone, onSuccess, onRetry }: Props) {
  const [steps, setSteps] = useState<StepperStep[]>([
    { id: 'gbd', label: 'Проверка ГБД ФЛ (соответствие ИИН ↔ ФИО)', status: 'in_progress' },
    { id: 'bmg', label: 'Проверка БМГ (телефон принадлежит ИИН)', status: 'pending' },
  ]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const gbdResult = await checkGbdFl({ iin, fio });
      if (cancelled) return;
      if (gbdResult.status === 'error') {
        setSteps((s) => s.map((step) => (step.id === 'gbd' ? { ...step, status: 'error', detail: gbdResult.message } : step)));
        setFailed(true);
        return;
      }
      setSteps((s) =>
        s.map((step) => (step.id === 'gbd' ? { ...step, status: 'success' } : step.id === 'bmg' ? { ...step, status: 'in_progress' } : step)),
      );

      const bmgResult = await checkBmg({ iin, phone });
      if (cancelled) return;
      if (bmgResult.status === 'error') {
        setSteps((s) => s.map((step) => (step.id === 'bmg' ? { ...step, status: 'error', detail: bmgResult.message } : step)));
        setFailed(true);
        return;
      }
      setSteps((s) => s.map((step) => (step.id === 'bmg' ? { ...step, status: 'success' } : step)));
      onSuccess();
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [iin, fio, phone, onSuccess]);

  return (
    <div className="space-y-6">
      <StepperStatus steps={steps} />
      {failed && (
        <Button type="button" variant="outline" onClick={onRetry} className="w-full">
          Ввести данные заново
        </Button>
      )}
    </div>
  );
}
