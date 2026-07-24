import type { VariantProps } from 'class-variance-authority';
import type { AnomalyType, CaseStatus, RiskTier } from '@/types/entities';
import { status } from '@/theme/colors';
import type { badgeVariants } from '@/components/ui/badge';

/**
 * Пороги риск-тиров — High 80–100 / Medium 50–79 / Low 0–49 (Analytics Deep Dive, разд. 2.2).
 * Документ задаёт их явно только для очереди кейсов; здесь же применяются к регионам и сетям АЗС —
 * единая шкала по всему дашборду (см. допущение в OPEN_QUESTIONS.md).
 */
export function riskTierOf(score: number): RiskTier {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export const RISK_TIER_LABEL: Record<RiskTier, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

/** Тот же зелёный/красный, что уже используются в потребительском приложении (status.ok/blocked) — плюс новый амбер для Medium, валидировано dataviz-скиллом (все 5 проверок PASS, light). */
export const RISK_TIER_COLOR: Record<RiskTier, string> = {
  high: status.blocked,
  medium: status.warning,
  low: status.ok,
};

export const ANOMALY_TYPE_LABEL: Record<AnomalyType, string> = {
  export_smuggling: 'Вывоз/контрабанда',
  limit_exceeded: 'Превышение лимита',
  frequent_shuttle: 'Паттерн «профессиональный челнок»',
  technical_failure: 'Технические сбои',
};

export const ANOMALY_TYPE_DESCRIPTION: Record<AnomalyType, string> = {
  export_smuggling: 'Повышенный объём у одного и того же лица в приграничном регионе — признак вывоза за рубеж',
  limit_exceeded: 'Обслуживание продолжено по предельной цене сверх суточного лимита',
  frequent_shuttle: 'Многократные заправки в разных АЗС за короткий интервал — признак перепродажи',
  technical_failure: 'Расхождение данных источников (ОФД/СНТ/МВД) — требует технической проверки, не обязательно мошенничество',
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  closed: 'Закрыт',
};

export const CASE_STATUS_BADGE_VARIANT: Record<CaseStatus, VariantProps<typeof badgeVariants>['variant']> = {
  new: 'warning',
  in_progress: 'default',
  closed: 'secondary',
};
