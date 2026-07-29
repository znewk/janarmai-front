import { Search, Sparkles, ChevronRight, CircleCheck, Bot, Award, Home, QrCode, LayoutGrid, MessageSquare, User } from 'lucide-react';
import { PhoneStatusBar } from '@/components/ui/PhoneStatusBar';

interface EgovMobileHomeMockProps {
  onOpenApp: () => void;
}

/**
 * Имитация главного экрана приложения eGov Mobile (не наш UI) — визуальный «контекст», в котором
 * пользователь якобы находится перед тем, как открыть JanarmAI из списка гос. сервисов.
 * Оформление подробно скопировано с реального интерфейса (статус-бар, поиск, баннеры,
 * цифровые документы, нижняя навигация) — по запросу, чтобы экран было не отличить от настоящего.
 * Грид сервисов сведён к двум плиткам: «egov · Госуслуги» (как в реальном приложении)
 * и JanarmAI на месте остальных иконок сервисов — по запросу.
 */
export function EgovMobileHomeMock({ onOpenApp }: EgovMobileHomeMockProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PhoneStatusBar />

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5 text-sm text-gray-400">
            <Search className="h-4 w-4" />
            Быстрый поиск
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <div className="mb-6 flex gap-3 overflow-x-hidden">
          <div className="relative flex h-24 w-40 shrink-0 flex-col justify-center overflow-hidden rounded-2xl bg-gray-50 p-3">
            <p className="flex items-center gap-1 text-[11px] font-bold leading-tight text-blue-600">
              <CircleCheck className="h-3 w-3 shrink-0" />
              ГОЛОСУЙ ЗА ОБНОВЛЕНИЕ!
            </p>
            <div className="pointer-events-none absolute -bottom-5 -right-5 h-16 w-16 rounded-full bg-gradient-to-tr from-sky-400 via-amber-300 to-sky-600 opacity-90" />
          </div>
          <div className="relative h-24 flex-1 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-950 p-3 text-white">
            <span className="absolute right-2 top-2 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">AI</span>
            <div className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold text-white/90">alem.ai</span>
            </div>
            <p className="mt-1.5 max-w-[85%] text-[12px] font-bold leading-tight">Получай услуги с помощью EgovGPT</p>
            <p className="mt-0.5 text-[10px] leading-tight text-white/70">Твой личный ИИ-ассистент по госуслугам</p>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="w-[38%] shrink-0">
            <p className="text-base font-bold leading-tight text-gray-900">Цифровые документы</p>
            <button type="button" className="mt-2 flex items-center gap-0.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Все
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-1 gap-2">
            <DocThumb label="Удостоверение личности" />
            <DocThumb label="Водительские права" />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-x-3 gap-y-5">
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-1 py-4 text-white">
            <span className="text-base font-extrabold italic tracking-tight">egov</span>
            <span className="text-center text-[10px] font-medium leading-tight">Госуслуги</span>
          </div>
          <button type="button" onClick={onOpenApp} className="flex flex-col items-center gap-1.5 text-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">J</span>
            <span className="text-[10px] font-medium leading-tight text-navy-700">JanarmAI</span>
          </button>
        </div>

        <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-800 p-4 text-white">
          <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">Часто задаваемые вопросы</span>
          <p className="relative z-10 mt-3 max-w-[70%] text-[15px] font-bold leading-tight">Вопросы и ответы по Налоговому кодексу</p>
          <Award className="pointer-events-none absolute -bottom-3 right-3 h-16 w-16 text-white/15" />
          <div className="relative z-10 mt-4 flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
            ))}
          </div>
        </div>

        <p className="text-base font-bold text-gray-900">Популярные услуги</p>
      </div>

      <div className="flex items-center justify-around border-t border-gray-200 py-2 text-[11px] text-gray-400">
        <span className="flex flex-col items-center gap-1 text-blue-600">
          <Home className="h-5 w-5" />
          Главная
        </span>
        <span className="flex flex-col items-center gap-1">
          <QrCode className="h-5 w-5" />
          egov QR
        </span>
        <span className="flex flex-col items-center gap-1">
          <LayoutGrid className="h-5 w-5" />
          Сервисы
        </span>
        <span className="flex flex-col items-center gap-1">
          <MessageSquare className="h-5 w-5" />
          Сообщения
        </span>
        <span className="flex flex-col items-center gap-1">
          <User className="h-5 w-5" />
          Профиль
        </span>
      </div>
    </div>
  );
}

/** Мини-превью документа (ТЗ не касается — чисто декоративная деталь для узнаваемости экрана eGov). */
function DocThumb({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-blue-50 p-2.5 pb-3 text-center">
      <div className="flex h-12 w-16 flex-col justify-between rounded-md bg-white p-1.5 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 shrink-0 rounded-[2px] bg-gradient-to-b from-sky-400 to-blue-600" />
          <span className="h-1 flex-1 rounded-full bg-gray-200" />
        </div>
        <span className="h-1 w-3/4 rounded-full bg-gray-200" />
        <span className="h-1 w-1/2 rounded-full bg-gray-200" />
      </div>
      <p className="text-[11px] font-medium leading-tight text-gray-700">{label}</p>
    </div>
  );
}
