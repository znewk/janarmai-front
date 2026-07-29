import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Globe, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { ChartLine } from '@/components/ui/ChartLine';
import { ChartDonut } from '@/components/ui/ChartDonut';
import { KzHeatMap } from '@/components/ui/KzHeatMap';
import { GapByCounterpartyList } from '@/components/ui/GapByCounterpartyList';
import { FuelVolumeBreakdown } from '@/components/ui/FuelVolumeBreakdown';
import { OverLimitShareCard } from '@/components/ui/OverLimitShareCard';
import { AnalyticsFilterBar, regionOptionLabel } from '@/components/ui/AnalyticsFilterBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { chartCategorical } from '@/theme/colors';
import { formatTons } from '@/lib/fuelDensity';
import { useDataFreshnessLabel } from '@/lib/useDataFreshness';
import { TONE_ICON, TONE_BG, TONE_TEXT, TONE_HEX } from '@/lib/shareToneUI';
import {
  DEFAULT_FILTERS,
  computeFuelBreakdown,
  computeSunpReconciliation,
  computeNonresidentShare,
  computeOverLimitShare,
  shareTone,
  NONRESIDENT_SPIKE_THRESHOLD_PCT,
  OVER_LIMIT_SHARE_THRESHOLD_PCT,
  FUEL_DROPOFF_THRESHOLD_PCT,
  VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT,
  type DashboardFilters,
  type ShareTone,
} from '@/lib/analyticsCompute';
import { adminUsersSeed, regionConsumptionSeed, procurementGapByCounterpartySeed, regionFuelFactsSeed } from '@/mocks/seed';
import { useAdminStore } from '@/store/admin.store';

interface MetricLegendItem {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

/**
 * Раньше здесь был «Классификатор аномалий» — 3 карточки-счётчика (сколько регионов/марок за
 * период попало под порог). Убран по замечанию: 2 из 3 категорий дублировали статус региона,
 * который уже виден с реальными цифрами по каждому региону в сводной таблице под тепловой картой
 * (см. KzHeatMap.tsx), а 3-я (отток марки) без счётчика никому не нужна отдельным блоком — это
 * просто справочник порогов, которые дашборд использует, без собственных данных/фильтров.
 */
const METRIC_LEGEND: MetricLegendItem[] = [
  {
    key: 'fuel_dropoff',
    icon: TrendingDown,
    label: 'Резкий отток марки топлива в регионе',
    description: `Объём марки топлива в регионе за период упал на ${FUEL_DROPOFF_THRESHOLD_PCT}%+ к среднему за предыдущий период — видно в разбивке по маркам при выборе региона на тепловой карте.`,
  },
  {
    key: 'nonresident_spike',
    icon: Globe,
    label: 'Аномально высокая доля отпуска нерезидентам',
    description: `Доля нерезидентов в объёме отпуска ≥ ${NONRESIDENT_SPIKE_THRESHOLD_PCT}% — один из двух показателей, формирующих статус региона (тепловая карта и сводная таблица).`,
  },
  {
    key: 'over_limit_share',
    icon: Gauge,
    label: 'Повышенная доля операций сверх лимита',
    description: `Доля объёма по рыночной цене (сверх суточного лимита) ≥ ${OVER_LIMIT_SHARE_THRESHOLD_PCT}% — второй показатель статуса региона; статус = худший из двух.`,
  },
  {
    key: 'volume_growth',
    icon: TrendingUp,
    label: 'Заметный рост объёма к предыдущему периоду',
    description: `Рост ≥ ${VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT}% — не нарушение, а повод посмотреть внимательнее: может быть легитимный сезонный спрос. Показывается отдельно от статуса.`,
  },
];

const TONE_LABEL: Record<ShareTone, string> = { ok: 'Низкий уровень', warning: 'Повышенный уровень', critical: 'Высокий уровень' };

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-3 text-xs font-semibold tracking-wide text-navy-400 uppercase">{children}</p>;
}

/**
 * Дашборд аналитического модуля — переработан по замечаниям ПМ (заказчика), см. PROGRESS.md
 * «Переработка аналитического модуля»: 4 новых главных показателя (объём по маркам в тоннах,
 * сверка с СУНП, доля отпуска нерезидентам по объёму, доля операций сверх лимита), единый блок
 * глобальных фильтров, тепловая карта с боковой панелью деталей региона по клику, классификатор
 * аномалий из 3 категорий. Очередь кейсов (бывший операционный слой) скрыта полностью — см.
 * admin/routes.tsx. Все главные показатели считаются из `regionFuelFactsSeed` через
 * `src/lib/analyticsCompute.ts` с учётом текущих фильтров.
 */
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const adminId = useAdminStore((s) => s.currentAdminId);
  const logout = useAdminStore((s) => s.logout);
  const admin = adminUsersSeed.find((a) => a.id === adminId);
  const freshnessLabel = useDataFreshnessLabel();

  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  /** Подпись под заголовками — «по регионам РК», пока не выбран конкретный регион в глобальном фильтре, иначе — какой именно. */
  const regionScopeLabel = filters.region === 'all' ? 'по регионам РК' : `регион: ${regionOptionLabel(filters.region)}`;

  const fuelBreakdown = useMemo(() => computeFuelBreakdown(regionFuelFactsSeed, filters), [filters]);
  const sunp = useMemo(() => computeSunpReconciliation(regionFuelFactsSeed, filters), [filters]);
  const overLimit = useMemo(() => computeOverLimitShare(regionFuelFactsSeed, filters), [filters]);
  const nonresident = useMemo(() => computeNonresidentShare(regionFuelFactsSeed, filters), [filters]);
  const nonresidentTone = shareTone(nonresident.sharePct, NONRESIDENT_SPIKE_THRESHOLD_PCT / 2, NONRESIDENT_SPIKE_THRESHOLD_PCT);
  const NonresidentToneIcon = TONE_ICON[nonresidentTone];
  const residentSharePct = Math.round((100 - nonresident.sharePct) * 10) / 10;

  const handleFiltersChange = (patch: Partial<DashboardFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="space-y-10 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-navy-400">Оперативные показатели</p>
          <h1 className="text-2xl font-bold text-navy-900">Дашборд JanarmAI</h1>
        </div>
        <div className="flex items-center gap-3">
          {admin && (
            <p className="text-right text-sm text-navy-500">
              {admin.fio} · {admin.role}
            </p>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </div>

      <section>
        {/* <SectionLabel>Фильтры (влияют на все показатели ниже)</SectionLabel> */}
        <div className="rounded-2xl border border-navy-100 bg-white p-4">
          <AnalyticsFilterBar filters={filters} onChange={handleFiltersChange} />
        </div>
      </section>

      {/* Главные показатели — по замечанию ПМ (см. PROGRESS.md) */}
      <section className="space-y-4">
        <SectionLabel>Главные показатели</SectionLabel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Объём реализации по маркам топлива</CardTitle>
              <CardDescription>тонны, {regionScopeLabel}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <FuelVolumeBreakdown items={fuelBreakdown} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Сверка с СУНП</CardTitle>
              <CardDescription>Реализация по СУНП vs Реализация JanarmAI ({regionScopeLabel})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-navy-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-navy-500 uppercase">Реализация (СУНП)</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">{formatTons(sunp.purchaseT, 0)}</p>
                  <p className="text-xs text-navy-400">{Math.round(sunp.purchaseL).toLocaleString('ru-RU')} л</p>
                </div>
                <div className="rounded-2xl bg-navy-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-navy-500 uppercase">Факт (JanarmAI)</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">{formatTons(sunp.realizedT, 0)}</p>
                  <p className="text-xs text-navy-400">{Math.round(sunp.realizedL).toLocaleString('ru-RU')} л</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">Соотношение</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-orange-600">{sunp.ratioPct}%</p>
                </div>
              </div>
              <ChartLine
                data={sunp.weeklyTrend}
                xKey="label"
                series={[
                  { key: 'purchaseT', label: 'Реализация СУНП, т', color: chartCategorical.navy },
                  { key: 'realizedT', label: 'Факт, т', color: chartCategorical.orange },
                ]}
                height={180}
              />
              <Separator className="my-4" />
              <p className="mb-2 text-xs font-semibold text-navy-600">Разрыв по топ-5 контрагентам/сетям</p>
              <GapByCounterpartyList counterparties={procurementGapByCounterpartySeed} totalGapT={sunp.purchaseT - sunp.realizedT} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Доля отпуска нерезидентам</CardTitle>
              <CardDescription>по объёму отпусков (не по числу зарегистрированных нерезидентов), {regionScopeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="min-w-0 flex-1">
                  <div className={`mb-3 rounded-2xl p-4 ${TONE_BG[nonresidentTone]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold tracking-wide uppercase ${TONE_TEXT[nonresidentTone]}`}>Доля нерезидентам</p>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${TONE_TEXT[nonresidentTone]}`}>
                        <NonresidentToneIcon className="h-3.5 w-3.5" />
                        {TONE_LABEL[nonresidentTone]}
                      </span>
                    </div>
                    <p className={`mt-1 text-4xl font-bold tabular-nums ${TONE_TEXT[nonresidentTone]}`}>{nonresident.sharePct}%</p>
                    <p className="text-[11px] text-navy-400">
                      {nonresident.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т отпущено нерезидентам · порог классификатора — {NONRESIDENT_SPIKE_THRESHOLD_PCT}%
                    </p>
                  </div>
                  <ChartLine data={nonresident.trend} xKey="label" series={[{ key: 'sharePct', label: 'Доля нерезидентов, %', color: TONE_HEX[nonresidentTone] }]} height={140} />
                </div>

                {/* Та же цифра (nonresident.sharePct), что и в плитке слева — раньше донат «Структура потребления» ниже по странице
                    брал данные из отдельного, не связанного с фильтрами consumptionStructureSeed и показывал другой %
                    (см. замечание «почему не совпадает процент»). Теперь один источник данных — просто другая визуализация. */}
                <div className="flex shrink-0 flex-col items-center md:w-[180px]">
                  <ChartDonut
                    data={[
                      { name: 'Резиденты', value: residentSharePct, color: chartCategorical.navy },
                      { name: 'Нерезиденты', value: nonresident.sharePct, color: chartCategorical.orange },
                    ]}
                    centerValue={`${residentSharePct}%`}
                    centerLabel="резиденты"
                    height={160}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <OverLimitShareCard result={overLimit} />
        </div>
      </section>

      {/* Тактический слой — вспомогательные виджеты */}
      <section className="space-y-6">
        <SectionLabel>Тактический слой</SectionLabel>

        <Card>
          <CardHeader>
            <CardTitle>Тепловая карта по регионам РК</CardTitle>
            <CardDescription>Заливка — риск-уровень региона (severity), размер маркера — объём. Клик по региону — детали в панели справа.</CardDescription>
          </CardHeader>
          <CardContent>
            <KzHeatMap data={regionConsumptionSeed} facts={regionFuelFactsSeed} filters={filters} />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Методология — показатели и пороги</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {METRIC_LEGEND.map((item) => (
              <div key={item.key} className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-600">
                  <item.icon className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900">{item.label}</p>
                  <p className="text-xs text-navy-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-navy-300">
        Данные актуальны на {freshnessLabel}
      </p>
    </div>
  );
}
