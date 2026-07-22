import { useEffect, useState } from 'react';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { checkBerkut } from '@/mocks/api';

interface Props {
  passportNumber: string;
  onSuccess: () => void;
  onRejected: (message: string) => void;
}

/** S-07 — степпер проверки ИС «Беркут» (личность + факт въезда, ТЗ 4.3/4.5). */
export function BerkutStep({ passportNumber, onSuccess, onRejected }: Props) {
  const [steps, setSteps] = useState<StepperStep[]>([
    { id: 'berkut', label: 'Проверка ИС «Беркут» (личность + факт въезда)', status: 'in_progress' },
  ]);

  useEffect(() => {
    let cancelled = false;
    checkBerkut({ passportNumber }).then((res) => {
      if (cancelled) return;
      if (res.status === 'error') {
        setSteps((s) => s.map((step) => ({ ...step, status: 'error', detail: res.message })));
        onRejected(res.message);
      } else {
        setSteps((s) => s.map((step) => ({ ...step, status: 'success' })));
        onSuccess();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [passportNumber, onSuccess, onRejected]);

  return <StepperStatus steps={steps} />;
}
