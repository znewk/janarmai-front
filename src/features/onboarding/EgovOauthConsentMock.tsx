import { ChevronLeft, X, Menu, Wifi, SignalHigh } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EgovOauthConsentMockProps {
  onAllow: () => void;
  onDeny: () => void;
  onClose: () => void;
}

/**
 * Имитация стандартного экрана согласия eGov на передачу данных стороннему сервису
 * (аналог OAuth-consent) — показывается после тапа по плитке JanarmAI на `EgovMobileHomeMock`.
 * «Разрешить» продолжает во внутренний визард JanarmAI, «Запретить»/крестик возвращают в eGov.
 */
export function EgovOauthConsentMock({ onAllow, onDeny, onClose }: EgovOauthConsentMockProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <div className="flex items-center justify-between px-4 pb-1 pt-3 text-xs font-medium">
        <span>07:59</span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <SignalHigh className="h-3.5 w-3.5" />
          <Wifi className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-2 text-gray-500">
        <button type="button" onClick={onDeny} aria-label="Назад">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" onClick={onClose} aria-label="Закрыть">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="text-blue-600">e</span>
          <span>gov</span>
          <span className="mx-1 h-5 w-px bg-gray-300" />
          <span className="text-lg font-semibold text-gray-400">1414</span>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Menu className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Пожалуйста, подтвердите действие</h1>
        <div className="space-y-4 text-gray-500">
          <p>
            Настоящим вы разрешаете <span className="font-semibold text-gray-800">приложению «JanarmAI»</span> получать доступ к вашим защищённым
            ресурсам.
          </p>
          <ul className="space-y-2 text-left">
            <li className="flex gap-2">
              <span>•</span>
              <span>ФИО, ИИН, дата рождения</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Номер телефона</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-3 px-6 pb-8">
        <Button type="button" onClick={onAllow} className="w-full bg-blue-600 py-6 text-base font-semibold text-white shadow-none hover:bg-blue-700">
          Разрешить
        </Button>
        <Button
          type="button"
          onClick={onDeny}
          variant="ghost"
          className="w-full bg-red-50 py-6 text-base font-semibold text-red-500 shadow-none hover:bg-red-100"
        >
          Запретить
        </Button>
      </div>
      <p className="pb-4 text-center text-[11px] text-gray-400">© Электронное правительство Республики Казахстан</p>
    </div>
  );
}
