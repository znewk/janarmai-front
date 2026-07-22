import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
      <p className="text-xs text-navy-400">Компания-нерезидент — без проверки в ГБД ЮЛ, данные вводятся вручную</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-500">Наименование компании</label>
        <input {...register('name')} className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" placeholder="ООО «Компания»" />
        {errors.name && <p className="mt-1 text-xs text-status-blocked">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-500">Регистрационный номер</label>
        <input {...register('registrationNumber')} className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" placeholder="RU-7743012345" />
        {errors.registrationNumber && <p className="mt-1 text-xs text-status-blocked">{errors.registrationNumber.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-500">Номер телефона</label>
        <input {...register('phone')} className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" placeholder="+74951234567" />
        {errors.phone && <p className="mt-1 text-xs text-status-blocked">{errors.phone.message}</p>}
      </div>
      <button type="submit" className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
        Продолжить
      </button>
    </form>
  );
}
