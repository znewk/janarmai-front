import { useState } from 'react';
import type { FuelType } from '@/types/entities';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

interface Props {
  suggestedVolumeL: number;
  onStart: (params: { fuelType: FuelType; volumeL: number }) => void;
  onCancel: () => void;
}

const FUEL_TYPES: FuelType[] = ['ai92', 'ai95', 'dt'];

/** S-19 — выбор параметров демо-заправки: вид топлива и объём (ТЗ 5.0). */
export function FuelingParamsStep({ suggestedVolumeL, onStart, onCancel }: Props) {
  const [fuelType, setFuelType] = useState<FuelType>('ai92');
  const [volumeL, setVolumeL] = useState(suggestedVolumeL);

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-medium text-navy-500">Вид топлива</label>
        <div className="flex gap-2">
          {FUEL_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setFuelType(ft)}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${fuelType === ft ? 'border-navy-600 bg-navy-600 text-white' : 'border-navy-200 text-navy-700'}`}
            >
              {FUEL_TYPE_LABEL[ft]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-navy-500">Объём, л</label>
        <input
          type="number"
          min={1}
          value={volumeL}
          onChange={(e) => setVolumeL(Number(e.target.value))}
          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          {[suggestedVolumeL, Math.round(suggestedVolumeL * 1.5), suggestedVolumeL * 3].map((v) => (
            <button key={v} type="button" onClick={() => setVolumeL(v)} className="rounded-full border border-navy-200 px-3 py-1 text-xs text-navy-600">
              {v} л
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-navy-400">Подсказка: объём больше остатка лимита демонстрирует отпуск по предельной цене</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-navy-300 py-3 font-semibold text-navy-700">
          Отмена
        </button>
        <button
          type="button"
          disabled={volumeL <= 0}
          onClick={() => onStart({ fuelType, volumeL })}
          className="flex-1 rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-40"
        >
          Симулировать заправку
        </button>
      </div>
    </div>
  );
}
