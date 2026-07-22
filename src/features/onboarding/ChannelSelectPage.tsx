import { useNavigate } from 'react-router-dom';
import { Smartphone, Wallet, Building2 } from 'lucide-react';
import { ChannelCard } from '@/components/ui/ChannelCard';

/** S-00 — выбор канала входа (ТЗ 4.0). */
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
          title="eGov Mobile"
          subtitle="Данные уже верифицированы каналом"
          onClick={() => navigate('/register/egov-bvu', { state: { channel: 'egov' } })}
        />
        <ChannelCard
          icon={Wallet}
          title="Приложение БВУ"
          subtitle="Kaspi, Halyk и др."
          onClick={() => navigate('/register/egov-bvu', { state: { channel: 'bvu' } })}
        />
        <ChannelCard icon={Building2} title="Приложение КМГ" subtitle="Полная проверка — для всех типов лиц" onClick={() => navigate('/register/kmg')} />
      </div>

      <p className="mt-8 text-center text-sm text-navy-400">
        Уже есть аккаунт?{' '}
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-navy-700">
          Войти
        </button>
      </p>
    </div>
  );
}
