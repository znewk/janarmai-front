import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PhoneStatusBar } from '@/components/ui/PhoneStatusBar';

interface EgovSsoLoadingMockProps {
  onDone: () => void;
  delayMs?: number;
}

/**
 * Имитация короткой загрузки при SSO-переходе из eGov в JanarmAI (после тапа по плитке
 * приложения) — без отдельного экрана подтверждения доступа: eGov уже авторизовал сессию.
 */
export function EgovSsoLoadingMock({ onDone, delayMs = 1400 }: EgovSsoLoadingMockProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PhoneStatusBar />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-700" />
        <p className="text-sm font-medium text-gray-700">Выполняется вход через eGov…</p>
        <p className="text-xs text-gray-400">Передаём подтверждённые данные в приложение JanarmAI</p>
      </div>
    </div>
  );
}
