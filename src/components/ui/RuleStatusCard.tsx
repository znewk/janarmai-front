import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ControlRule } from '@/mocks/seed';

/** Карточка-правило со статусом легально/блокировка (A-06, ТЗ 8.5) — цвет + иконка + подпись, не только цвет. */
export function RuleStatusCard({ rule }: { rule: ControlRule }) {
  const isOk = rule.status === 'ok';
  const Icon = isOk ? CheckCircle2 : ShieldAlert;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isOk ? 'bg-status-ok' : 'bg-status-blocked'}`}>
        <Icon className="h-5 w-5 text-white" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-900">{rule.title}</p>
        <p className="text-xs text-navy-400">{rule.description}</p>
        <span className={`mt-1 inline-block text-xs font-semibold ${isOk ? 'text-status-ok' : 'text-status-blocked'}`}>
          {isOk ? 'Легально' : 'Блокировка'}
        </span>
      </div>
    </div>
  );
}
