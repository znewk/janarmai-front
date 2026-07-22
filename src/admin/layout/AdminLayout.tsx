import { Outlet } from 'react-router-dom';

/**
 * Layout аналитического модуля — desktop-only (ТЗ раздел 4.7, тех.план раздел 8):
 * визуально отделён от потребительского приложения, минимальная ширина 1280px.
 */
export function AdminLayout() {
  return (
    <div className="min-h-screen min-w-[1280px] bg-navy-950 text-white">
      <header className="flex items-center gap-3 border-b border-navy-800 px-8 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
          J
        </div>
        <span className="text-lg font-semibold tracking-wide">JanarmAI · Аналитика</span>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
