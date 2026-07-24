import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OtpInput } from '@/components/ui/OtpInput';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        <div className="space-y-1.5">
          <Label htmlFor="ecp-bin">БИН компании</Label>
          <Input id="ecp-bin" {...register('bin')} placeholder="123456789012" inputMode="numeric" />
          {errors.bin && <p className="text-xs text-status-blocked">{errors.bin.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ecp-director-fio">ФИО представителя (администратора автопарка)</Label>
          <Input id="ecp-director-fio" {...register('directorFio')} placeholder="Иванов Иван Иванович" />
          {errors.directorFio && <p className="text-xs text-status-blocked">{errors.directorFio.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ecp-phone">Номер телефона</Label>
          <Input id="ecp-phone" {...register('phone')} placeholder="+77011234567" />
          {errors.phone && <p className="text-xs text-status-blocked">{errors.phone.message}</p>}
        </div>
        <Button type="submit" className="w-full">
          Продолжить
        </Button>
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
