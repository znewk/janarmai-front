import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import type { FleetVehicleDraft } from './VehicleFleetStep';
import { checkGbdFl } from '@/mocks/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      <p className="text-xs text-gray-400">Необязательный шаг — водитель используется только для истории «кто заправлял»</p>
      {vehicles.map((v, i) => (
        <Card key={i}>
          <p className="text-xs font-medium text-gray-500">
            {v.grnz} · {CATEGORY_LABEL[v.category]}
          </p>
          <Input value={rows[i].fio} onChange={(e) => updateRow(i, { fio: e.target.value, checked: false })} placeholder="ФИО водителя (опционально)" />
          <div className="flex gap-2">
            <Input value={rows[i].iin} onChange={(e) => updateRow(i, { iin: e.target.value, checked: false })} placeholder="ИИН водителя" inputMode="numeric" className="flex-1" />
            <Button type="button" variant="secondary" size="sm" onClick={() => checkDriver(i)} disabled={!rows[i].fio || !rows[i].iin || rows[i].checking} className="w-24">
              {rows[i].checking ? <Loader2 className="h-4 w-4 animate-spin" /> : rows[i].checked ? <Check className="h-4 w-4 text-status-ok" /> : 'Проверить'}
            </Button>
          </div>
        </Card>
      ))}
      <Button type="button" onClick={handleContinue} className="w-full">
        Продолжить
      </Button>
    </div>
  );
}
