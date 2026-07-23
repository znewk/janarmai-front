import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export interface WizardShellProps {
  title: string;
  stepIndex: number;
  stepCount: number;
  onBack?: () => void;
  children: ReactNode;
}

/** Общая обвязка шагов визарда регистрации/авторизации: шапка с прогрессом и кнопкой «назад». */
export function WizardShell({ title, stepIndex, stepCount, onBack, children }: WizardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-gray-50/95 px-4 py-3 backdrop-blur">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Назад"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-navy-700 shadow-sm shadow-gray-200/60 transition-transform active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
        ) : (
          <span className="w-9" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: stepCount }).map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
