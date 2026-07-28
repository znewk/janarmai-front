import { ShieldCheck, TriangleAlert, ShieldAlert, type LucideIcon } from 'lucide-react';
import type { ShareTone } from './analyticsCompute';
import { status as statusColors } from '@/theme/colors';

/** Общие стили светофора (зелёный/жёлтый/красный) для карточек показателей — единая точка, чтобы не дублировать в каждом компоненте (AdminDashboardPage/OverLimitShareCard/NetworkRiskList/KzHeatMap). */
export const TONE_ICON: Record<ShareTone, LucideIcon> = { ok: ShieldCheck, warning: TriangleAlert, critical: ShieldAlert };
export const TONE_TEXT: Record<ShareTone, string> = { ok: 'text-status-ok', warning: 'text-status-warning', critical: 'text-status-blocked' };
export const TONE_BG: Record<ShareTone, string> = { ok: 'bg-status-ok/10', warning: 'bg-status-warning/10', critical: 'bg-status-blocked/10' };
export const TONE_HEX: Record<ShareTone, string> = { ok: statusColors.ok, warning: statusColors.warning, critical: statusColors.blocked };

/** Единый текст пояснения для статуса региона (тепловая карта + сводная таблица) — чтобы формулировка не разъезжалась в двух местах. */
export const REGION_STATUS_EXPLANATION =
  'Статус — худший из двух показателей: доля отпуска нерезидентам (порог 20%) и доля операций сверх суточного лимита (порог 15%). ' +
  'До половины порога — «Низкий», от половины до порога — «Средний», порог и выше — «Высокий». Берётся более тревожный из двух.';

/** Единый текст пояснения для роста объёма (тепловая карта + сводная таблица) — намеренно НЕ про нарушение. */
export const VOLUME_GROWTH_EXPLANATION =
  '% изменения объёма реализации к предыдущему периоду той же длины. Это не показатель нарушения: быстрый рост объёма может быть ' +
  'легитимным сезонным спросом (например, посевная или уборочная кампания требует больше ДТ). Выделяется отдельно от статуса риска — ' +
  'как повод посмотреть на регион внимательнее, а не как обвинение.';
