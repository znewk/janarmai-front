import { Outlet } from 'react-router-dom';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { ToastViewport } from '@/components/ui/ToastNotification';

/**
 * Оболочка «залогиненной» части приложения — Главная / Карта / История / Кабинет с нижней
 * таб-навигацией, в стиле современных супераппов (референс — eGov Mobile 3.0, по запросу пользователя).
 * Онбординг/вход используют более простой `ConsumerLayout` без табов.
 */
export function AppShellLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[428px] flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto pb-2">
          <Outlet />
        </div>
        <BottomTabBar />
        <ToastViewport />
      </div>
    </div>
  );
}
