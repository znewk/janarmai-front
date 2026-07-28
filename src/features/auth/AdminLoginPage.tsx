import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminCredentials } from '@/mocks/api';
import { useAdminStore } from '@/store/admin.store';
import { adminUsersSeed } from '@/mocks/seed';
import type { AdminRole } from '@/types/entities';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  kmg: 'АО НК «КазМунайГаз»',
  minenergo: 'Минэнерго РК',
  akimat: 'Акимат',
};

/**
 * A-00 — вход администратора/аналитика (ТЗ 4.7). Раньше выглядела как отдельная тёмная
 * landing-страница, не связанная визуально с самим аналитическим модулем — по замечанию
 * приведена к стилю `AdminLayout.tsx` (тот же navy-950 хедер, тот же светлый фон контента),
 * чтобы вход воспринимался как часть одной деловой системы, а не отдельный промо-экран.
 * Все демо-учётки выведены внизу экрана мелким текстом — для демонстрации без реального бэкенда.
 */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAdminStore((s) => s.login);
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const res = await checkAdminCredentials(loginValue, password);
    setChecking(false);
    if (res.status === 'error') {
      setError(res.message);
      return;
    }
    login(res.data.id);
    navigate('/admin/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-50 text-navy-900">
      <header className="border-b border-navy-800 bg-navy-950">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-8">
          <div className="select-none">
            <h1 className="text-lg font-semibold tracking-wide text-white">JanarmAI</h1>
            <p className="text-[11px] tracking-[0.18em] text-navy-400 uppercase">Аналитический модуль</p>
          </div>
          <div className="hidden text-right lg:block">
            <p className="text-xs tracking-wide text-navy-400 uppercase">Система</p>
            <p className="text-sm text-white">Demo Environment</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">Единая система мониторинга топливных карт</p>
            <h2 className="mt-1 text-xl font-bold text-navy-900">Вход в аналитический модуль</h2>
            <p className="mt-1 text-sm text-navy-400">Доступ только для уполномоченных сотрудников КМГ, Минэнерго и акиматов.</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="contents">
              <div className="space-y-1.5">
                <Label htmlFor="admin-login">Логин</Label>
                <Input id="admin-login" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} placeholder="kmg.analyst" autoComplete="username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Пароль</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-xs text-status-blocked">{error}</p>}
              <Button type="submit" disabled={checking || !loginValue || !password} className="w-full" size="lg">
                {checking ? 'Проверка...' : 'Войти'}
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <footer className="border-t border-navy-100 bg-white px-8 py-4">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-navy-400 uppercase">Демо-доступ — тестовые учётные записи</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {adminUsersSeed.map((u) => (
              <span key={u.id} className="text-[11px] text-navy-400">
                <span className="font-medium text-navy-600">{ADMIN_ROLE_LABEL[u.role]}:</span> {u.login} / {u.password}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
