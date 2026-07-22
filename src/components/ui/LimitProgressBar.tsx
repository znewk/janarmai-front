export interface LimitProgressBarProps {
  usedL: number;
  /** null — льготный лимит не применяется (иностранец/ЮЛ-нерезидент), потолка нет (см. OPEN_QUESTIONS.md). */
  limitL: number | null;
  /** Порог, после которого заливка становится предупреждающей (по умолчанию 80%, ТЗ 5.1). */
  warningThreshold?: number;
}

/** Индикатор остатка лимита — синий в норме, оранжевый при приближении/превышении (ТЗ 8.3). */
export function LimitProgressBar({ usedL, limitL, warningThreshold = 0.8 }: LimitProgressBarProps) {
  if (limitL === null) {
    return (
      <div>
        <p className="text-sm text-navy-600">
          Использовано сегодня: <span className="font-semibold text-navy-900">{usedL} л</span>
        </p>
        <p className="text-xs text-navy-400">Льготный лимит не применяется — обслуживание по предельной цене без потолка</p>
      </div>
    );
  }

  const ratio = limitL > 0 ? usedL / limitL : 0;
  const isWarning = ratio >= warningThreshold;
  const fillPercent = Math.min(ratio, 1) * 100;
  const remaining = Math.max(limitL - usedL, 0);

  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-navy-100">
        <div
          className={`h-full rounded-full transition-all ${isWarning ? 'bg-orange-500' : 'bg-navy-500'}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-navy-500">
        {usedL} / {limitL} л использовано сегодня · остаток{' '}
        <span className={isWarning ? 'font-semibold text-orange-600' : 'font-semibold text-navy-700'}>{remaining} л</span>
      </p>
    </div>
  );
}
