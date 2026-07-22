import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user.store';

/** Временная заглушка S-22/S-24 — полные кабинеты ФЛ/ЮЛ собираются на Этапе 6. Здесь проверяется сессия входа (Этап 4). */
export function CabinetPlaceholderPage() {
  const navigate = useNavigate();
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  const users = useUserStore((s) => s.users);
  const companies = useUserStore((s) => s.companies);
  const logout = useUserStore((s) => s.logout);

  const user = users.find((u) => u.id === currentUserId);
  const company = companies.find((c) => c.id === currentCompanyId);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="p-6">
      <span className="inline-block rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700">S-22/S-24</span>
      <h1 className="mt-3 text-xl font-bold text-navy-900">Личный кабинет</h1>
      <p className="mt-2 text-sm text-navy-500">Полные кабинеты ФЛ/ЮЛ (карты, история, автопарк) собираются на Этапе 6.</p>

      {!currentUserId && <p className="mt-4 text-sm text-status-blocked">Нет активной сессии — сначала войдите или зарегистрируйтесь.</p>}

      {user && (
        <div className="mt-6 space-y-1 rounded-xl border border-navy-100 bg-navy-50 p-4 text-sm">
          <p className="text-navy-400">Сессия {company ? 'ЮЛ (представитель)' : 'ФЛ'}</p>
          <p className="font-semibold text-navy-900">{user.fio}</p>
          <p className="text-navy-500">{user.phone}</p>
          {company && <p className="mt-2 font-semibold text-navy-900">{company.name}</p>}
        </div>
      )}

      {currentUserId && (
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => navigate('/card')} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
            Карта / QR
          </button>
          <button type="button" onClick={handleLogout} className="rounded-lg border border-navy-300 px-4 py-2 text-sm font-semibold text-navy-700">
            Выйти
          </button>
        </div>
      )}

      {!currentUserId && (
        <button type="button" onClick={() => navigate('/')} className="mt-6 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          На главную
        </button>
      )}
    </div>
  );
}
