import type { StationNetworkStat } from '@/mocks/seed';
import { riskTierOf } from '@/lib/riskTier';
import { RiskBadge } from './RiskBadge';

/** Ранжированный список сетей АЗС по риск-баллу 0–100, по убыванию (Deep Dive 4.2). */
export function NetworkRiskList({ networks }: { networks: StationNetworkStat[] }) {
  const sorted = [...networks].sort((a, b) => b.riskScore - a.riskScore);
  return (
    <ol className="space-y-2">
      {sorted.map((n, i) => {
        const gap = n.ofdReceipts - n.janarmaiAuthorizations;
        return (
          <li key={n.network} className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-xs font-semibold text-navy-300">#{i + 1}</span>
              <span className="truncate text-sm font-medium text-navy-900">{n.network}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`text-xs ${gap > 0 ? 'text-status-blocked' : 'text-navy-400'}`}>
                {gap > 0 ? '+' : ''}
                {gap.toLocaleString('ru-RU')} л расхождение
              </span>
              <RiskBadge tier={riskTierOf(n.riskScore)} score={n.riskScore} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
