import { useNavigate } from 'react-router-dom';
import { Smartphone, Building2 } from 'lucide-react';
import { ChannelCard } from '@/components/ui/ChannelCard';
import { Button } from '@/components/ui/button';

/**
 * S-00 — выбор канала входа (ТЗ 4.0).
 * eGov Mobile и приложения БВУ объединены в один пункт выбора — оба канала передают уже
 * верифицированные данные, поэтому для пользователя это один и тот же быстрый путь.
 * Согласие на обработку персональных данных показывается на первом экране визарда после
 * выбора канала — там, где уже видны конкретные данные пользователя (см. `EgovBvuRegisterPage.tsx`).
 */
export function ChannelSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-800">
          <span className="text-xl font-bold text-orange-400">J</span>
        </div>
        <h1 className="mt-3 text-xl font-bold text-navy-900">JanarmAI</h1>
        <p className="mt-1 text-sm text-navy-500">Единая система учёта отпуска ГСМ — выберите канал регистрации</p>
      </div>

      <div className="space-y-3">
        <ChannelCard
          icon={Smartphone}
          title="Через eGov / банковское приложение"
          subtitle="Быстрая регистрация без ввода данных"
          onClick={() => navigate('/register/egov-bvu')}
        />
        <ChannelCard icon={Building2} title="Приложение КМГ" subtitle="Регистрация с проверкой документов" onClick={() => navigate('/register/kmg')} />
      </div>

      <p className="mt-8 text-center text-sm text-navy-400">
        Уже есть аккаунт?{' '}
        <Button type="button" variant="link" onClick={() => navigate('/login')} className="h-auto p-0 font-semibold text-navy-700">
          Войти
        </Button>
      </p>
    </div>
  );
}
