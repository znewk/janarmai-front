import { useState } from 'react';
import { FileScan, ScanFace } from 'lucide-react';
import { verifyLiveness } from '@/mocks/api';

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
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-500">Номер паспорта</label>
        <input
          value={passportNumber}
          onChange={(e) => onPassportNumberChange(e.target.value)}
          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
          placeholder="P1234567"
        />
        <p className="mt-1 text-xs text-navy-400">Демо: номер с «DUP» — дубликат паспорта, с «NF» — личность не найдена в «Беркут»</p>
      </div>

      <button
        type="button"
        onClick={() => setMrzScanned(true)}
        disabled={mrzScanned || !passportNumber}
        className="flex w-full items-center gap-3 rounded-xl border border-navy-100 p-3 text-left disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600">
          <FileScan className="h-5 w-5 text-white" />
        </span>
        <span className="text-sm font-medium text-navy-900">{mrzScanned ? 'Паспорт отсканирован (MRZ)' : 'Сканировать паспорт'}</span>
      </button>

      <button
        type="button"
        onClick={runLiveness}
        disabled={!mrzScanned || livenessDone || checkingLiveness}
        className="flex w-full items-center gap-3 rounded-xl border border-navy-100 p-3 text-left disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600">
          <ScanFace className="h-5 w-5 text-white" />
        </span>
        <span className="text-sm font-medium text-navy-900">
          {checkingLiveness ? 'Проверка liveness...' : livenessDone ? 'Liveness пройден' : 'Пройти liveness-проверку (селфи)'}
        </span>
      </button>

      <button
        type="button"
        onClick={onComplete}
        disabled={!livenessDone}
        className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-40"
      >
        Продолжить
      </button>
    </div>
  );
}
