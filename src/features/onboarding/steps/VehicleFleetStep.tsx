import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      <Card>
        <div className="space-y-1.5">
          <Label htmlFor="fleet-grnz">ГРНЗ</Label>
          <Input id="fleet-grnz" value={grnz} onChange={(e) => setGrnz(e.target.value)} placeholder="777DDD01" />
        </div>
        <div className="space-y-1.5">
          <Label>Категория</Label>
          <div className="flex gap-2">
            {(['passenger', 'truck'] as VehicleCategory[]).map((c) => (
              <Button key={c} type="button" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)} className="flex-1 rounded-xl">
                {CATEGORY_LABEL[c]}
              </Button>
            ))}
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={addVehicle} disabled={!grnz.trim()} className="w-full">
          Добавить ТС
        </Button>
      </Card>

      {vehicles.length > 0 && (
        <ul className="space-y-2">
          {vehicles.map((v, i) => (
            <li key={i}>
              <Card className="flex-row items-center justify-between p-3">
                <span className="text-sm">
                  {v.grnz} · {CATEGORY_LABEL[v.category]}
                </span>
                <button type="button" onClick={() => removeVehicle(i)} aria-label="Удалить" className="text-gray-300 hover:text-status-blocked">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" disabled={vehicles.length === 0} onClick={() => onComplete(vehicles)} className="w-full">
        Продолжить ({vehicles.length})
      </Button>
    </div>
  );
}
