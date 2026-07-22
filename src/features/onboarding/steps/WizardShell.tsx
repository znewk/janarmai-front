import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

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
      <header className="flex items-center gap-3 border-b border-navy-100 px-4 py-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Назад" className="text-navy-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-900">{title}</p>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: stepCount }).map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-orange-500' : 'bg-navy-100'}`} />
            ))}
          </div>
        </div>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
