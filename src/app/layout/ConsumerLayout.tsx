import { Outlet, useNavigate } from 'react-router-dom';
import { ToastViewport } from '@/components/ui/ToastNotification';
import { resetDemoData } from '@/store';

/**
 * Layout онбординга/входа — mobile-first (ТЗ раздел 8, тех.план раздел 8):
 * базовая раскладка проектируется под ~375–428px (контейнер зафиксирован в 428px — верхняя граница диапазона),
 * на десктопе — тот же контейнер по центру. «Залогиненная» часть приложения использует `AppShellLayout` с табами.
 */
export function ConsumerLayout() {
  const navigate = useNavigate();

  const handleReset = () => {
    resetDemoData();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[428px] flex-col bg-gray-50">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="border-t border-gray-200 p-3 text-center">
          <button type="button" onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
            Сбросить демо-данные
          </button>
        </footer>
        <ToastViewport />
      </div>
    </div>
  );
}
