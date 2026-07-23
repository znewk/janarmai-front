import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';

export interface FleetVehicleDraft {
  grnz: string;
  category: VehicleCategory;
}

interface Props {
  onComplete: (vehicles: FleetVehicleDraft[]) => void;
}

const CATEGORY_LABEL: Record<VehicleCategory, string> = { passenger: 'легковая', truck: 'грузовая' };

/** S-13 — добавление ТС автопарка: форма ГРНЗ + категория, список добавленных (ТЗ 4.4/4.5). */
export function VehicleFleetStep({ onComplete }: Props) {
  const [vehicles, setVehicles] = useState<FleetVehicleDraft[]>([]);
  const [grnz, setGrnz] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('passenger');

  const addVehicle = () => {
    if (!grnz.trim()) return;
    setVehicles((v) => [...v, { grnz: grnz.trim().toUpperCase(), category }]);
    setGrnz('');
  };

  const removeVehicle = (index: number) => {
    setVehicles((v) => v.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm shadow-gray-200/60">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ГРНЗ</label>
          <input value={grnz} onChange={(e) => setGrnz(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="777DDD01" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Категория</label>
          <div className="flex gap-2">
            {(['passenger', 'truck'] as VehicleCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex-1 rounded-xl border py-2 text-sm ${category === c ? 'border-navy-600 bg-navy-600 text-white' : 'border-gray-200 text-gray-700'}`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={addVehicle} disabled={!grnz.trim()} className="w-full rounded-xl bg-gray-100 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40">
          Добавить ТС
        </button>
      </div>

      {vehicles.length > 0 && (
        <ul className="space-y-2">
          {vehicles.map((v, i) => (
            <li key={i} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 text-sm shadow-sm shadow-gray-200/60">
              <span>
                {v.grnz} · {CATEGORY_LABEL[v.category]}
              </span>
              <button type="button" onClick={() => removeVehicle(i)} aria-label="Удалить" className="text-gray-300 hover:text-status-blocked">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={vehicles.length === 0}
        onClick={() => onComplete(vehicles)}
        className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30 disabled:opacity-40"
      >
        Продолжить ({vehicles.length})
      </button>
    </div>
  );
}
