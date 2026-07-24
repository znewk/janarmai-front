import { Progress } from './progress';
import { Card } from './card';

export interface LimitProgressBarProps {
  usedL: number;
  /** null — льготный лимит не применяется (иностранец/ЮЛ-нерезидент), потолка нет (см. OPEN_QUESTIONS.md). */
  limitL: number | null;
  /** Порог, после которого заливка становится предупреждающей (по умолчанию 80%, ТЗ 5.1). */
  warningThreshold?: number;
  /** Собственная карточка-подложка — по умолчанию включена, чтобы бар был виден на сером фоне страницы, а не только внутри чужой Card (см. PROGRESS.md). */
  bare?: boolean;
}

/** Индикатор остатка лимита (на базе примитива `Progress`) — синий в норме, оранжевый при приближении/превышении (ТЗ 8.3). */
export function LimitProgressBar({ usedL, limitL, warningThreshold = 0.8, bare = false }: LimitProgressBarProps) {
  if (limitL === null) {
    const content = (
      <div>
        <p className="text-sm text-navy-600">
          Использовано сегодня: <span className="font-semibold text-navy-900">{usedL} л</span>
        </p>
        <p className="text-xs text-navy-400">Льготный лимит не применяется — обслуживание по предельной цене без потолка</p>
      </div>
    );
    return bare ? content : <Card>{content}</Card>;
  }

  const ratio = limitL > 0 ? usedL / limitL : 0;
  const isWarning = ratio >= warningThreshold;
  const fillPercent = Math.min(ratio, 1) * 100;
  const remaining = Math.max(limitL - usedL, 0);
  const warningMarkerPercent = Math.min(warningThreshold * 100, 100);

  const content = (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-xs font-medium text-navy-500">Лимит на сегодня</p>
        <p className={`text-sm font-bold tabular-nums ${isWarning ? 'text-orange-600' : 'text-navy-700'}`}>{Math.round(fillPercent)}%</p>
      </div>
      <div className="relative">
        <Progress
          value={fillPercent}
          className="h-4 bg-gray-200"
          indicatorClassName={isWarning ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-navy-500 to-navy-400'}
        />
        {warningMarkerPercent < 100 && (
          <span
            className="pointer-events-none absolute top-0 h-4 w-px bg-white/70"
            style={{ left: `${warningMarkerPercent}%` }}
            title={`Порог предупреждения — ${Math.round(warningThreshold * 100)}%`}
          />
        )}
      </div>
      <p className="mt-1.5 text-xs text-navy-500">
        {usedL} / {limitL} л использовано сегодня · остаток{' '}
        <span className={isWarning ? 'font-semibold text-orange-600' : 'font-semibold text-navy-700'}>{remaining} л</span>
      </p>
    </div>
  );

  return bare ? content : <Card>{content}</Card>;
}
