import { useState } from 'react';
import { FileScan, ScanFace } from 'lucide-react';
import { verifyLiveness } from '@/mocks/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  passportNumber: string;
  onPassportNumberChange: (value: string) => void;
  onComplete: () => void;
}

/** S-06 — загрузка/сканирование паспорта (MRZ, мок) + liveness-шаг (селфи, мок) — ТЗ 4.3/4.5. */
export function PassportLivenessStep({ passportNumber, onPassportNumberChange, onComplete }: Props) {
  const [mrzScanned, setMrzScanned] = useState(false);
  const [livenessDone, setLivenessDone] = useState(false);
  const [checkingLiveness, setCheckingLiveness] = useState(false);

  const runLiveness = async () => {
    setCheckingLiveness(true);
    await verifyLiveness();
    setCheckingLiveness(false);
    setLivenessDone(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="passport-number">Номер паспорта</Label>
        <Input id="passport-number" value={passportNumber} onChange={(e) => onPassportNumberChange(e.target.value)} placeholder="P1234567" />
        <p className="text-xs text-gray-400">Демо: номер с «DUP» — дубликат паспорта, с «NF» — личность не найдена в «Беркут»</p>
      </div>

      <button
        type="button"
        onClick={() => setMrzScanned(true)}
        disabled={mrzScanned || !passportNumber}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm shadow-gray-200/60 disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600">
          <FileScan className="h-5 w-5 text-white" />
        </span>
        <span className="text-sm font-medium text-gray-900">{mrzScanned ? 'Паспорт отсканирован (MRZ)' : 'Сканировать паспорт'}</span>
      </button>

      <button
        type="button"
        onClick={runLiveness}
        disabled={!mrzScanned || livenessDone || checkingLiveness}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm shadow-gray-200/60 disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600">
          <ScanFace className="h-5 w-5 text-white" />
        </span>
        <span className="text-sm font-medium text-gray-900">
          {checkingLiveness ? 'Проверка liveness...' : livenessDone ? 'Liveness пройден' : 'Пройти liveness-проверку (селфи)'}
        </span>
      </button>

      <Button type="button" onClick={onComplete} disabled={!livenessDone} className="w-full">
        Продолжить
      </Button>
    </div>
  );
}
