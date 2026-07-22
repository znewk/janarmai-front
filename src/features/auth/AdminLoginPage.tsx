import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminCredentials } from '@/mocks/api';
import { useAdminStore } from '@/store/admin.store';

/** A-00 — вход администратора/аналитика, отдельная landing-страница (ТЗ 4.7). */
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
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-8 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500">
            <span className="text-xl font-bold text-white">J</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">JanarmAI · Аналитика</h1>
          <p className="mt-1 text-sm text-navy-300">Служебный вход для КМГ / Минэнерго / акимата</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-300">Логин</label>
            <input
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
              placeholder="kmg.analyst"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-300">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-orange-400">{error}</p>}
          <button type="submit" disabled={checking || !loginValue || !password} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-40">
            {checking ? 'Проверка...' : 'Войти'}
          </button>
          <p className="text-center text-xs text-navy-400">Демо: kmg.analyst / demo1234</p>
        </form>
      </div>
    </div>
  );
}
