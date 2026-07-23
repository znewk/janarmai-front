import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useToastStore, type ToastItem, type ToastVariant } from './toastStore';

const ICON_BY_VARIANT: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
};

const CIRCLE_CLASS_BY_VARIANT: Record<ToastVariant, string> = {
  info: 'bg-navy-500',
  success: 'bg-status-ok',
  warning: 'bg-orange-500',
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const Icon = ICON_BY_VARIANT[toast.variant];
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-lg shadow-gray-300/40">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CIRCLE_CLASS_BY_VARIANT[toast.variant]}`}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
        {toast.description && <p className="text-xs text-gray-400">{toast.description}</p>}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Закрыть" className="text-gray-300 hover:text-gray-500">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Глобальный toast-viewport — монтируется один раз в layout (S-21, ТЗ 5.0/5.1). */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-md">
          <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}
