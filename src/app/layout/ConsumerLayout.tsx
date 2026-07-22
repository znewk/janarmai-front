import { Outlet } from 'react-router-dom';

/**
 * Layout потребительского модуля — mobile-first (ТЗ раздел 8, тех.план раздел 8):
 * базовая раскладка проектируется под ~375–428px, на десктопе — тот же контейнер по центру.
 */
export function ConsumerLayout() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
