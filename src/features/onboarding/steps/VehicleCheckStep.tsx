import { useEffect, useState } from 'react';
import type { VehicleCategory } from '@/types/entities';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { checkVehicleRegistry, checkOgpoInsurance } from '@/mocks/api';

export interface VehicleCheckResult {
  category: VehicleCategory;
  vehicle?: { grnz: string; category: VehicleCategory };
}

interface Props {
  /** ИИН/номер паспорта — используется при проверке ОГПО, если своего ТС нет. */
  identifier: string;
  onComplete: (result: VehicleCheckResult) => void;
}

/** S-08 — развилка «есть своё ТС» → ИС «Автомобиль»; «нет» → база страховок ОГПО/ЕСБД (ТЗ 4.1–4.5). */
export function VehicleCheckStep({ identifier, onComplete }: Props) {
  const [hasOwnVehicle, setHasOwnVehicle] = useState<boolean | null>(null);
  const [grnz, setGrnz] = useState('');
  const [steps, setSteps] = useState<StepperStep[] | null>(null);
  const [failed, setFailed] = useState(false);

  const checkVehicle = async () => {
    setSteps([{ id: 'vehicle', label: 'Проверка ИС «Автомобиль» (категория ТС по ГРНЗ)', status: 'in_progress' }]);
    setFailed(false);
    const res = await checkVehicleRegistry(grnz);
    if (res.status === 'error') {
      setSteps([{ id: 'vehicle', label: 'Проверка ИС «Автомобиль»', status: 'error', detail: res.message }]);
      setFailed(true);
      return;
    }
    setSteps([{ id: 'vehicle', label: 'Проверка ИС «Автомобиль»', status: 'success' }]);
    onComplete({ category: res.data.category, vehicle: { grnz: res.data.grnz, category: res.data.category } });
  };

  const runOgpoCheck = () => {
    setSteps([{ id: 'ogpo', label: 'Проверка базы страховок ОГПО / ЕСБД (вписан в чужой полис)', status: 'in_progress' }]);
    setFailed(false);
    checkOgpoInsurance(identifier).then((res) => {
      if (res.status === 'error') {
        setSteps([{ id: 'ogpo', label: 'Проверка базы страховок ОГПО / ЕСБД', status: 'error', detail: res.message }]);
        setFailed(true);
        return;
      }
      setSteps([{ id: 'ogpo', label: 'Проверка базы страховок ОГПО / ЕСБД', status: 'success' }]);
      onComplete({ category: 'passenger' });
    });
  };

  useEffect(() => {
    if (hasOwnVehicle === false) runOgpoCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOwnVehicle]);

  if (hasOwnVehicle === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-navy-600">У вас есть собственное транспортное средство?</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => setHasOwnVehicle(true)} className="flex-1 rounded-xl bg-navy-600 py-3 font-semibold text-white">
            Да
          </button>
          <button
            type="button"
            onClick={() => setHasOwnVehicle(false)}
            className="flex-1 rounded-xl border border-navy-300 py-3 font-semibold text-navy-700"
          >
            Нет
          </button>
        </div>
      </div>
    );
  }

  if (hasOwnVehicle && !steps) {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-500">ГРНЗ</label>
          <input value={grnz} onChange={(e) => setGrnz(e.target.value.toUpperCase())} className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" placeholder="001AAA02" />
          <p className="mt-1 text-xs text-navy-400">Демо: цифра в начале ГРНЗ — легковая, буква — грузовая; «ERR» — ТС не найдено</p>
        </div>
        <button type="button" disabled={!grnz} onClick={checkVehicle} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-40">
          Проверить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps && <StepperStatus steps={steps} />}
      {failed && (
        <button
          type="button"
          onClick={() => {
            setSteps(null);
            setHasOwnVehicle(null);
          }}
          className="w-full rounded-xl border border-navy-300 py-3 font-semibold text-navy-700"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
}
