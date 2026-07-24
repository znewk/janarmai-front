import { ShieldAlert, TriangleAlert, ShieldCheck } from 'lucide-react';
import type { RiskTier } from '@/types/entities';
import { RISK_TIER_LABEL } from '@/lib/riskTier';
import { Badge, type badgeVariants } from './badge';
import type { VariantProps } from 'class-variance-authority';

const ICON_BY_TIER: Record<RiskTier, typeof ShieldAlert> = {
  high: ShieldAlert,
  medium: TriangleAlert,
  low: ShieldCheck,
};

const VARIANT_BY_TIER: Record<RiskTier, VariantProps<typeof badgeVariants>['variant']> = {
  high: 'destructive',
  medium: 'warning',
  low: 'success',
};

export interface RiskBadgeProps {
  tier: RiskTier;
  /** Риск-балл 0–100 — если передан, выводится рядом с лейблом («High · 87»). */
  score?: number;
}

/** Цветовой бейдж риск-уровня (на базе примитива `Badge`) — всегда иконка + текстовая подпись, не только цвет (Deep Dive 2.2/4.3). */
export function RiskBadge({ tier, score }: RiskBadgeProps) {
  const Icon = ICON_BY_TIER[tier];
  return (
    <Badge variant={VARIANT_BY_TIER[tier]}>
      <Icon />
      {RISK_TIER_LABEL[tier]}
      {typeof score === 'number' ? ` · ${score}` : ''}
    </Badge>
  );
}
