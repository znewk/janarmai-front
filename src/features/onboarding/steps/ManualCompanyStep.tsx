import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().trim().min(2, 'Введите название компании'),
  registrationNumber: z.string().trim().min(2, 'Введите регистрационный номер'),
  phone: z.string().min(5, 'Введите номер телефона'),
});

export type ManualCompanyFormValues = z.infer<typeof schema>;

/** S-12 (ветка ЮЛ-нерезидент) — ручной ввод иностранной компании, без проверки ГБД ЮЛ (ТЗ 4.5). */
export function ManualCompanyStep({ onSubmit }: { onSubmit: (values: ManualCompanyFormValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualCompanyFormValues>({ resolver: zodResolver(schema) });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <p className="text-xs text-gray-400">Компания-нерезидент — без проверки в ГБД ЮЛ, данные вводятся вручную</p>
      <div className="space-y-1.5">
        <Label htmlFor="company-name">Наименование компании</Label>
        <Input id="company-name" {...register('name')} placeholder="ООО «Компания»" />
        {errors.name && <p className="text-xs text-status-blocked">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company-reg-number">Регистрационный номер</Label>
        <Input id="company-reg-number" {...register('registrationNumber')} placeholder="RU-7743012345" />
        {errors.registrationNumber && <p className="text-xs text-status-blocked">{errors.registrationNumber.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company-phone">Номер телефона</Label>
        <Input id="company-phone" {...register('phone')} placeholder="+74951234567" />
        {errors.phone && <p className="text-xs text-status-blocked">{errors.phone.message}</p>}
      </div>
      <Button type="submit" className="w-full">
        Продолжить
      </Button>
    </form>
  );
}
