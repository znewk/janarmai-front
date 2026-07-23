import { Check, Loader2, X, Clock } from 'lucide-react';

export type StepStatus = 'pending' | 'in_progress' | 'success' | 'error';

export interface StepperStep {
  id: string;
  label: string;
  status: StepStatus;
  /** Доп. пояснение — например, текст ошибки мок-проверки. */
  detail?: string;
}

const ICON_BY_STATUS: Record<StepStatus, typeof Check> = {
  pending: Clock,
  in_progress: Loader2,
  success: Check,
  error: X,
};

const CIRCLE_CLASS_BY_STATUS: Record<StepStatus, string> = {
  pending: 'bg-navy-200 text-navy-500',
  in_progress: 'bg-navy-500 text-white',
  success: 'bg-status-ok text-white',
  error: 'bg-status-blocked text-white',
};

/** Пошаговый статус проверки — «проверяется → успешно/ошибка» (ТЗ, S-05/S-07/S-20). */
export function StepperStatus({ steps }: { steps: StepperStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => {
        const Icon = ICON_BY_STATUS[step.status];
        return (
          <li key={step.id} className="flex items-start gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CIRCLE_CLASS_BY_STATUS[step.status]}`}>
              <Icon className={`h-4 w-4 ${step.status === 'in_progress' ? 'animate-spin' : ''}`} />
            </span>
            <div>
              <p className={`text-sm font-medium ${step.status === 'error' ? 'text-status-blocked' : 'text-gray-900'}`}>{step.label}</p>
              {step.detail && <p className="text-xs text-gray-400">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
