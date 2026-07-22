import { useNavigate } from 'react-router-dom';
import { adminUsersSeed } from '@/mocks/seed';
import { useAdminStore } from '@/store/admin.store';

/** Временная заглушка A-01..A-06 — полный дашборд собирается на Этапе 7. Здесь проверяется только сессия входа (Этап 4). */
export function AdminDashboardPlaceholderPage() {
  const navigate = useNavigate();
  const adminId = useAdminStore((s) => s.currentAdminId);
  const logout = useAdminStore((s) => s.logout);
  const admin = adminUsersSeed.find((a) => a.id === adminId);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="p-8">
      <span className="inline-block rounded-full bg-navy-800 px-3 py-1 text-xs font-semibold text-orange-400">A-01..A-06</span>
      <h1 className="mt-3 text-xl font-bold">Аналитический дашборд</h1>
      <p className="mt-2 text-sm text-navy-300">Полный набор виджетов (KPI, графики, тепловая карта РК) собирается на Этапе 7.</p>
      {admin && (
        <div className="mt-6 rounded-xl border border-navy-800 bg-navy-900 p-4 text-sm">
          <p className="text-navy-400">Сессия администратора</p>
          <p className="mt-1 font-semibold">{admin.fio}</p>
          <p className="text-navy-400">
            {admin.login} · роль: {admin.role}
          </p>
        </div>
      )}
      <button type="button" onClick={handleLogout} className="mt-6 rounded-lg border border-navy-700 px-4 py-2 text-sm font-semibold text-white">
        Выйти
      </button>
    </div>
  );
}
