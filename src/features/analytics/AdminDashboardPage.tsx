import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Gauge, Globe, TrendingDown, type LucideIcon } from 'lucide-react';
import { ChartLine } from '@/components/ui/ChartLine';
import { ChartDonut } from '@/components/ui/ChartDonut';
import { ChartBar } from '@/components/ui/ChartBar';
import { KzHeatMap } from '@/components/ui/KzHeatMap';
import { AnomalyCategoryCard } from '@/components/ui/AnomalyCategoryCard';
import { NetworkRiskList } from '@/components/ui/NetworkRiskList';
import { GapByCounterpartyList } from '@/components/ui/GapByCounterpartyList';
import { FuelVolumeBreakdown } from '@/components/ui/FuelVolumeBreakdown';
import { OverLimitShareCard } from '@/components/ui/OverLimitShareCard';
import { AnalyticsFilterBar } from '@/components/ui/AnalyticsFilterBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { chartCategorical } from '@/theme/colors';
import { formatTons } from '@/lib/fuelDensity';
import { useDataFreshnessLabel } from '@/lib/useDataFreshness';
import {
  DEFAULT_FILTERS,
  computeFuelBreakdown,
  computeSunpReconciliation,
  computeNonresidentShare,
  computeOverLimitShare,
  computeAnomalyClassifier,
  type DashboardFilters,
  type DashboardAnomalyCategory,
} from '@/lib/analyticsCompute';
import {
  adminUsersSeed,
  regionConsumptionSeed,
  consumptionStructureSeed,
  stationNetworkStatsSeed,
  procurementGapByCounterpartySeed,
  regionFuelFactsSeed,
} from '@/mocks/seed';
import { useAdminStore } from '@/store/admin.store';

const ANOMALY_ICON: Record<DashboardAnomalyCategory, LucideIcon> = {
  fuel_dropoff: TrendingDown,
  nonresident_spike: Globe,
  over_limit_share: Gauge,
};

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
  const [nonresidentFilters, setNonresidentFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const fuelBreakdown = useMemo(() => computeFuelBreakdown(regionFuelFactsSeed, filters), [filters]);
  const sunp = useMemo(() => computeSunpReconciliation(regionFuelFactsSeed, filters), [filters]);
  const overLimit = useMemo(() => computeOverLimitShare(regionFuelFactsSeed, filters), [filters]);
  const nonresident = useMemo(() => computeNonresidentShare(regionFuelFactsSeed, nonresidentFilters), [nonresidentFilters]);
  const anomalies = useMemo(() => computeAnomalyClassifier(regionFuelFactsSeed, filters), [filters]);

  const latestConsumption = consumptionStructureSeed[consumptionStructureSeed.length - 1];
  const prevConsumption = consumptionStructureSeed[consumptionStructureSeed.length - 2];
  const nonresidentSnapshotDeltaPp = Math.round((latestConsumption.nonresidentSharePct - prevConsumption.nonresidentSharePct) * 10) / 10;
  const NonresSnapshotDeltaIcon = nonresidentSnapshotDeltaPp >= 0 ? ArrowUpRight : ArrowDownRight;

  const handleFiltersChange = (patch: Partial<DashboardFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const handleNonresidentFiltersChange = (patch: Partial<DashboardFilters>) => setNonresidentFilters((f) => ({ ...f, ...patch }));

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
        <SectionLabel>Фильтры (влияют на все показатели ниже)</SectionLabel>
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
              <CardDescription>тонны, дельта к предыдущему периоду той же длины</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <FuelVolumeBreakdown items={fuelBreakdown} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Сверка с СУНП</CardTitle>
              <CardDescription>закуп по СУНП vs фактическая реализация JanarmAI, по регионам РК</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-navy-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-navy-500 uppercase">Закуп (СУНП)</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">{formatTons(sunp.purchaseT, 0)}</p>
                </div>
                <div className="rounded-2xl bg-navy-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-navy-500 uppercase">Факт (JanarmAI)</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-navy-900">{formatTons(sunp.realizedT, 0)}</p>
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
                  { key: 'purchaseT', label: 'Закуп СУНП, т', color: chartCategorical.navy },
                  { key: 'realizedT', label: 'Факт, т', color: chartCategorical.orange },
                ]}
                height={180}
              />
              <Separator className="my-4" />
              <p className="mb-2 text-xs font-semibold text-navy-600">Разрыв по топ-5 контрагентам/сетям</p>
              <GapByCounterpartyList counterparties={procurementGapByCounterpartySeed} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Доля отпуска нерезидентам</CardTitle>
              <CardDescription>по объёму отпусков (не по числу зарегистрированных нерезидентов)</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsFilterBar filters={nonresidentFilters} onChange={handleNonresidentFiltersChange} fields={['date', 'region']} className="mb-4" />
              <div className="mb-3 rounded-2xl bg-orange-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">Доля нерезидентам</p>
                <p className="mt-1 text-4xl font-bold tabular-nums text-orange-600">{nonresident.sharePct}%</p>
              </div>
              <ChartLine data={nonresident.trend} xKey="label" series={[{ key: 'sharePct', label: 'Доля нерезидентов, %', color: chartCategorical.orange }]} height={140} />
            </CardContent>
          </Card>

          <OverLimitShareCard result={overLimit} />
        </div>
      </section>

      {/* Тактический слой — вспомогательные виджеты */}
      <section className="space-y-6">
        <SectionLabel>Тактический слой — почему именно так</SectionLabel>

        <Card>
          <CardHeader>
            <CardTitle>Рейтинг сетей АЗС по «чистоте»</CardTitle>
            <CardDescription>Авторизации JanarmAI vs чеки ОФД + риск-балл по сети, сортировка по убыванию риска</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartBar
              data={stationNetworkStatsSeed}
              xKey="network"
              series={[
                { key: 'janarmaiAuthorizations', label: 'Авторизации JanarmAI', color: chartCategorical.navy },
                { key: 'ofdReceipts', label: 'Чеки ОФД', color: chartCategorical.orange },
              ]}
            />
            <Separator className="my-4" />
            <NetworkRiskList networks={stationNetworkStatsSeed} />
          </CardContent>
        </Card>

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
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Классификатор аномалий</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {anomalies.map((point) => (
              <AnomalyCategoryCard key={point.category} point={point} icon={ANOMALY_ICON[point.category]} />
            ))}
          </div>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Структура потребления (снимок)</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              Доля нерезидентов: {latestConsumption.nonresidentSharePct}%
              <span className={`inline-flex items-center gap-0.5 font-semibold ${nonresidentSnapshotDeltaPp >= 0 ? 'text-status-blocked' : 'text-status-ok'}`}>
                <NonresSnapshotDeltaIcon className="h-3 w-3" />
                {Math.abs(nonresidentSnapshotDeltaPp)} п.п. к пред. месяцу
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartDonut
              data={[
                { name: 'Резиденты', value: latestConsumption.residentSharePct, color: chartCategorical.navy },
                { name: 'Нерезиденты', value: latestConsumption.nonresidentSharePct, color: chartCategorical.orange },
              ]}
              centerValue={`${latestConsumption.residentSharePct}%`}
              centerLabel="резиденты"
              height={160}
            />
          </CardContent>
        </Card>
      </section>

      <p className="text-center text-xs text-navy-300">
        Данные актуальны на {freshnessLabel} · период сравнения главных показателей — к предыдущему периоду той же длины
      </p>
    </div>
  );
}
