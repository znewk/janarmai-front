import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { ToastViewport } from '@/components/ui/ToastNotification';
import { PhoneStatusBar } from '@/components/ui/PhoneStatusBar';
import { useCardStore } from '@/store';

/** Как часто проверять, не наступила ли полночь по Астане для сброса суточного счётчика (см. `card.resetAt`). */
const DAILY_RESET_CHECK_INTERVAL_MS = 60_000;

/**
 * Оболочка «залогиненной» части приложения — Главная / Карта / История / Кабинет с нижней
 * таб-навигацией, в стиле современных супераппов (референс — eGov Mobile 3.0, по запросу пользователя).
 * Онбординг/вход используют более простой `ConsumerLayout` без табов.
 */
export function AppShellLayout() {
  useEffect(() => {
    /**
     * `card.resetAt`/`resetDaily` были в модели данных с самого начала, но ничего не вызывало
     * их автоматически — `usedTodayL` рос бесконечно (особенно заметно на аккаунтах «только
     * мониторинг», где нет потолка лимита, скрывающего это визуально прогресс-баром).
     * Проверяем раз в минуту все карты сессии и сбрасываем те, у кого `resetAt` уже прошёл.
     */
    const resetExpiredCards = () => {
      const { cards, resetDaily } = useCardStore.getState();
      const now = Date.now();
      for (const card of cards) {
        if (new Date(card.resetAt).getTime() <= now) {
          resetDaily(card.id);
        }
      }
    };
    resetExpiredCards();
    const interval = setInterval(resetExpiredCards, DAILY_RESET_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[428px] flex-col bg-gray-50">
        <PhoneStatusBar timeClassName="text-orange-500" className="bg-gray-50" />
        <div className="flex-1 overflow-y-auto pb-2">
          <Outlet />
        </div>
        <BottomTabBar />
        <ToastViewport />
      </div>
    </div>
  );
}
