import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  fio: z.string().trim().min(3, 'Введите ФИО полностью'),
  iin: z.string().regex(/^\d{12}$/, 'ИИН должен содержать 12 цифр'),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
});

export type IinPhoneFormValues = z.infer<typeof schema>;

/** S-04 — ручной ввод ИИН и телефона (полный путь КМГ, ТЗ 4.2). */
export function IinPhoneFormStep({ onSubmit, defaultValues }: { onSubmit: (values: IinPhoneFormValues) => void; defaultValues?: Partial<IinPhoneFormValues> }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IinPhoneFormValues>({ resolver: zodResolver(schema), defaultValues });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="fl-fio">ФИО</Label>
        <Input id="fl-fio" {...register('fio')} placeholder="Иванов Иван Иванович" />
        {errors.fio && <p className="text-xs text-status-blocked">{errors.fio.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fl-iin">ИИН</Label>
        <Input id="fl-iin" {...register('iin')} placeholder="123456789012" inputMode="numeric" />
        {errors.iin && <p className="text-xs text-status-blocked">{errors.iin.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fl-phone">Номер телефона</Label>
        <Input id="fl-phone" {...register('phone')} placeholder="+77011234567" />
        {errors.phone && <p className="text-xs text-status-blocked">{errors.phone.message}</p>}
      </div>
      <Button type="submit" className="w-full">
        Продолжить
      </Button>
    </form>
  );
}
