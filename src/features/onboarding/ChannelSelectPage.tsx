import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Building2 } from 'lucide-react';
import { ChannelCard } from '@/components/ui/ChannelCard';

/**
 * S-00 — выбор канала входа + согласие на обработку персональных данных на одном экране (ТЗ 4.0).
 * eGov Mobile и приложения БВУ объединены в один пункт выбора — оба канала передают уже
 * верифицированные данные, поэтому для пользователя это один и тот же быстрый путь.
 * Согласие — внизу экрана, обязательно для продолжения по любому из каналов.
 */
export function ChannelSelectPage() {
  const navigate = useNavigate();
  const [consentChecked, setConsentChecked] = useState(false);

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
          subtitle="Данные уже верифицированы каналом"
          disabled={!consentChecked}
          onClick={() => navigate('/register/egov-bvu')}
        />
        <ChannelCard
          icon={Building2}
          title="Приложение КМГ"
          subtitle="Полная проверка — для всех типов лиц"
          disabled={!consentChecked}
          onClick={() => navigate('/register/kmg')}
        />
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-xl border border-navy-100 p-3">
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-navy-600"
        />
        <span className="text-sm text-navy-700">Я согласен(на) на обработку персональных данных в системе учёта отпуска ГСМ</span>
      </label>

      <p className="mt-6 text-center text-sm text-navy-400">
        Уже есть аккаунт?{' '}
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-navy-700">
          Войти
        </button>
      </p>
    </div>
  );
}
