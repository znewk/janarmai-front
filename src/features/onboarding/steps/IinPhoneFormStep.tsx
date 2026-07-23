import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ФИО</label>
        <input {...register('fio')} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="Иванов Иван Иванович" />
        {errors.fio && <p className="mt-1 text-xs text-status-blocked">{errors.fio.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ИИН</label>
        <input {...register('iin')} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="123456789012" inputMode="numeric" />
        {errors.iin && <p className="mt-1 text-xs text-status-blocked">{errors.iin.message}</p>}
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
