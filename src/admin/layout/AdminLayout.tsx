import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resetDemoData } from '@/store';
import { cn } from '@/lib/utils';

const NAV_TABS = [
  { to: '/admin/dashboard', label: 'Дашборд' },
  { to: '/admin/report', label: 'Отчёт' },
];

/**
 * Layout аналитического модуля — desktop-only (ТЗ раздел 4.7, тех.план раздел 8).
 * Базовый фон контента — белый (ТЗ 8.1: «Белый — базовый фон контента ... аналитический модуль»);
 * navy используется для шапки/акцентных подложек блоков, а не всей страницы.
 * Нав-вкладка «Очередь кейсов» убрана по замечанию ПМ — страница полностью скрыта (см. admin/routes.tsx).
 * Вкладка «Отчёт» — по запросу ПМ: фильтры + предпросмотр сводной таблицы + выгрузка CSV (`ReportPage.tsx`).
 */
export function AdminLayout() {
  const navigate = useNavigate();

  const handleReset = () => {
    resetDemoData();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen min-w-[1280px]  text-navy-900 bg-navy-50">
      <header className="sticky top-0 z-50 border-b border-navy-800 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/90">
        <div className="flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <div className="select-none">
              <h1 className="text-lg font-semibold tracking-wide text-white">
                JanarmAI
              </h1>
              <p className="text-[11px] uppercase tracking-[0.18em] text-navy-400">
                Аналитический модуль
              </p>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-navy-300 hover:text-white',
                    )
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden text-right lg:block">
              <p className="text-xs uppercase tracking-wide text-navy-400">
                Система
              </p>
              <p className="text-sm text-white">
                Demo Environment
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2 text-navy-300 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить данные
            </Button>
          </div>
        </div>
      </header>

      <main className="bg-navy-50">
        <Outlet />
      </main>
    </div>
  );
}
