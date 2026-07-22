import { Outlet, useNavigate } from 'react-router-dom';
import { ToastViewport } from '@/components/ui/ToastNotification';
import { resetDemoData } from '@/store';

/**
 * Layout потребительского модуля — mobile-first (ТЗ раздел 8, тех.план раздел 8):
 * базовая раскладка проектируется под ~375–428px (контейнер зафиксирован в 428px — верхняя граница диапазона),
 * на десктопе — тот же контейнер по центру.
 */
export function ConsumerLayout() {
  const navigate = useNavigate();

  const handleReset = () => {
    resetDemoData();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[428px] flex-col bg-white shadow-sm">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="border-t border-navy-100 p-3 text-center">
          <button type="button" onClick={handleReset} className="text-xs text-navy-300 hover:text-navy-500">
            Сбросить демо-данные
          </button>
        </footer>
        <ToastViewport />
      </div>
    </div>
  );
}
