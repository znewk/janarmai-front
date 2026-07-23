import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OtpInput } from '@/components/ui/OtpInput';
import { signEcp } from '@/mocks/api';

const schema = z.object({
  bin: z.string().regex(/^\d{12}$/, 'БИН должен содержать 12 цифр'),
  directorFio: z.string().trim().min(3, 'Введите ФИО полностью'),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
});

export type EcpBinFormValues = z.infer<typeof schema>;

interface Props {
  onComplete: (values: EcpBinFormValues) => void;
}

/** S-11 — вход администратора автопарка: БИН компании + имитация подписания ЭЦП (ТЗ 4.4). */
export function EcpBinStep({ onComplete }: Props) {
  const [formValues, setFormValues] = useState<EcpBinFormValues | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EcpBinFormValues>({ resolver: zodResolver(schema) });

  if (!formValues) {
    return (
      <form className="space-y-4" onSubmit={handleSubmit(setFormValues)}>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">БИН компании</label>
          <input {...register('bin')} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="123456789012" inputMode="numeric" />
          {errors.bin && <p className="mt-1 text-xs text-status-blocked">{errors.bin.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ФИО представителя (администратора автопарка)</label>
          <input {...register('directorFio')} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="Иванов Иван Иванович" />
          {errors.directorFio && <p className="mt-1 text-xs text-status-blocked">{errors.directorFio.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Номер телефона</label>
          <input {...register('phone')} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="+77011234567" />
          {errors.phone && <p className="mt-1 text-xs text-status-blocked">{errors.phone.message}</p>}
        </div>
        <button type="submit" className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30">
          Продолжить
        </button>
      </form>
    );
  }

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length !== 4) return;
    setSigning(true);
    setError(null);
    signEcp(value).then((res) => {
      setSigning(false);
      if (res.status === 'success') {
        onComplete(formValues);
      } else {
        setError(res.message);
        setCode('');
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-navy-600">Подпишите форму ЭЦП — введите код подтверждения</p>
      <OtpInput length={4} value={code} onChange={handleCodeChange} error={!!error} disabled={signing} />
      {signing && <p className="text-xs text-navy-400">Подписание...</p>}
      {error && <p className="text-xs text-status-blocked">{error}</p>}
    </div>
  );
}
