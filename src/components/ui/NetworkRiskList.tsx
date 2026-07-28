import type { StationNetworkStat } from '@/mocks/seed';
import { shareTone, type ShareTone } from '@/lib/analyticsCompute';
import { TONE_ICON, TONE_TEXT, TONE_BG } from '@/lib/shareToneUI';

const TONE_LABEL: Record<ShareTone, string> = { ok: 'В норме', warning: 'Есть расхождение', critical: 'Требует проверки' };

/** Насколько чеков ОФД (кассовых) больше, чем подтверждённых JanarmAI операций, в % — свой порог для этого виджета (сеть АЗС), не завязан на пороги классификатора аномалий (тот считает по региону). */
const WARN_AT_PCT = 5;
const RISK_AT_PCT = 15;

/** Ранжированный список сетей АЗС по проценту расхождения чеков ОФД и подтверждений JanarmAI, по убыванию — вместо абстрактного риск-балла 0–100 показывает понятный %. */
export function NetworkRiskList({ networks }: { networks: StationNetworkStat[] }) {
  const withGap = networks.map((n) => {
    const gapCount = n.ofdReceipts - n.janarmaiAuthorizations;
    const gapPct = n.janarmaiAuthorizations > 0 ? Math.round((gapCount / n.janarmaiAuthorizations) * 1000) / 10 : 0;
    return { ...n, gapCount, gapPct };
  });
  const sorted = [...withGap].sort((a, b) => b.gapPct - a.gapPct);

  return (
    <ol className="space-y-2">
      {sorted.map((n, i) => {
        const tone = shareTone(n.gapPct, WARN_AT_PCT, RISK_AT_PCT);
        const ToneIcon = TONE_ICON[tone];
        return (
          <li key={n.network} className={`flex items-center justify-between gap-3 rounded-lg p-3 ${TONE_BG[tone]}`}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-xs font-semibold text-navy-300">#{i + 1}</span>
              <span className="truncate text-sm font-medium text-navy-900">{n.network}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-navy-400">
                {n.gapCount > 0 ? '+' : ''}
                {n.gapCount.toLocaleString('ru-RU')} чеков ОФД сверх подтверждений JanarmAI
              </span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${TONE_TEXT[tone]}`}>
                <ToneIcon className="h-3.5 w-3.5" />
                {n.gapPct > 0 ? '+' : ''}
                {n.gapPct}% · {TONE_LABEL[tone]}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
