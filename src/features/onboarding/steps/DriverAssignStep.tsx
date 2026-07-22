import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import type { FleetVehicleDraft } from './VehicleFleetStep';
import { checkGbdFl } from '@/mocks/api';

export interface DriverAssignment {
  fio: string;
  iin: string;
  checked: boolean;
}

interface Props {
  vehicles: FleetVehicleDraft[];
  onComplete: (assignments: (DriverAssignment | null)[]) => void;
}

const CATEGORY_LABEL: Record<VehicleCategory, string> = { passenger: 'легковая', truck: 'грузовая' };

/** S-14 — опциональная привязка водителя к ТС (ИИН + ФИО, имитация проверки ГБД ФЛ) — не влияет на лимит (ТЗ 4.4/4.5). */
export function DriverAssignStep({ vehicles, onComplete }: Props) {
  const [rows, setRows] = useState<{ fio: string; iin: string; checking: boolean; checked: boolean }[]>(
    vehicles.map(() => ({ fio: '', iin: '', checking: false, checked: false })),
  );

  const updateRow = (index: number, patch: Partial<(typeof rows)[number]>) => {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const checkDriver = async (index: number) => {
    const row = rows[index];
    if (!row.fio || !row.iin) return;
    updateRow(index, { checking: true });
    await checkGbdFl({ iin: row.iin, fio: row.fio });
    updateRow(index, { checking: false, checked: true });
  };

  const handleContinue = () => {
    onComplete(rows.map((r) => (r.fio && r.iin ? { fio: r.fio, iin: r.iin, checked: r.checked } : null)));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-navy-400">Необязательный шаг — водитель используется только для истории «кто заправлял»</p>
      {vehicles.map((v, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-navy-100 p-3">
          <p className="text-xs font-medium text-navy-500">
            {v.grnz} · {CATEGORY_LABEL[v.category]}
          </p>
          <input
            value={rows[i].fio}
            onChange={(e) => updateRow(i, { fio: e.target.value, checked: false })}
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
            placeholder="ФИО водителя (опционально)"
          />
          <div className="flex gap-2">
            <input
              value={rows[i].iin}
              onChange={(e) => updateRow(i, { iin: e.target.value, checked: false })}
              className="flex-1 rounded-lg border border-navy-200 px-3 py-2 text-sm"
              placeholder="ИИН водителя"
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => checkDriver(i)}
              disabled={!rows[i].fio || !rows[i].iin || rows[i].checking}
              className="flex w-24 items-center justify-center gap-1 rounded-lg border border-navy-300 text-xs font-semibold text-navy-700 disabled:opacity-40"
            >
              {rows[i].checking ? <Loader2 className="h-4 w-4 animate-spin" /> : rows[i].checked ? <Check className="h-4 w-4 text-status-ok" /> : 'Проверить'}
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={handleContinue} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
        Продолжить
      </button>
    </div>
  );
}
