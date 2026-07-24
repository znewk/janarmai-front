import { useEffect, useState } from 'react';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { Button } from '@/components/ui/button';
import { checkGbdUl } from '@/mocks/api';

interface Props {
  bin: string;
  onSuccess: (companyName: string) => void;
  onRetry: () => void;
}

/** S-12 — проверка ГБД ЮЛ по БИН → подтягивание названия компании (ТЗ 4.4). */
export function GbdUlStep({ bin, onSuccess, onRetry }: Props) {
  const [steps, setSteps] = useState<StepperStep[]>([{ id: 'gbdul', label: 'Проверка ГБД ЮЛ (БИН → название компании)', status: 'in_progress' }]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkGbdUl(bin).then((res) => {
      if (cancelled) return;
      if (res.status === 'error') {
        setSteps([{ id: 'gbdul', label: 'Проверка ГБД ЮЛ', status: 'error', detail: res.message }]);
        setFailed(true);
        return;
      }
      setSteps([{ id: 'gbdul', label: 'Проверка ГБД ЮЛ', status: 'success' }]);
      onSuccess(res.data.name);
    });
    return () => {
      cancelled = true;
    };
  }, [bin, onSuccess]);

  return (
    <div className="space-y-6">
      <StepperStatus steps={steps} />
      {failed && (
        <Button type="button" variant="outline" onClick={onRetry} className="w-full">
          Ввести БИН заново
        </Button>
      )}
    </div>
  );
}
