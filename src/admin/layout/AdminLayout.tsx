import { Outlet, useNavigate } from 'react-router-dom';
import { resetDemoData } from '@/store';

/**
 * Layout аналитического модуля — desktop-only (ТЗ раздел 4.7, тех.план раздел 8).
 * Базовый фон контента — белый (ТЗ 8.1: «Белый — базовый фон контента ... аналитический модуль»);
 * navy используется для шапки/акцентных подложек блоков, а не всей страницы.
 */
export function AdminLayout() {
  const navigate = useNavigate();

  const handleReset = () => {
    resetDemoData();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen min-w-[1280px] bg-white text-navy-900">
      <header className="flex items-center justify-between gap-3 bg-navy-950 px-8 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
            J
          </div>
          <span className="text-lg font-semibold tracking-wide">JanarmAI · Аналитика</span>
        </div>
        <button type="button" onClick={handleReset} className="text-xs text-navy-400 hover:text-navy-200">
          Сбросить демо-данные
        </button>
      </header>
      <main className="bg-navy-50">
        <Outlet />
      </main>
    </div>
  );
}
