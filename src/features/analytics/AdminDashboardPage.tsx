import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { KpiTile } from '@/components/ui/KpiTile';
import { ChartLine } from '@/components/ui/ChartLine';
import { ChartDonut } from '@/components/ui/ChartDonut';
import { ChartBar } from '@/components/ui/ChartBar';
import { KzHeatMap } from '@/components/ui/KzHeatMap';
import { AnomalyCategoryCard } from '@/components/ui/AnomalyCategoryCard';
import { NetworkRiskList } from '@/components/ui/NetworkRiskList';
import { GapByCounterpartyList } from '@/components/ui/GapByCounterpartyList';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { chartCategorical } from '@/theme/colors';
import { ANOMALY_TYPE_LABEL, CASE_STATUS_BADGE_VARIANT, CASE_STATUS_LABEL } from '@/lib/riskTier';
import { useDataFreshnessLabel } from '@/lib/useDataFreshness';
import {
  adminUsersSeed,
  kpiSeed,
  monthlyLegalitySeed,
  legalityGapByCounterpartySeed,
  stationNetworkStatsSeed,
  consumptionStructureSeed,
  regionConsumptionSeed,
  fuelTourismSeed,
  anomalyTaxonomySeed,
} from '@/mocks/seed';
import { useAdminStore } from '@/store/admin.store';
import { useCaseStore } from '@/store/case.store';

const OPERATIONAL_PREVIEW_SIZE = 8;

function formatCaseDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-3 text-xs font-semibold tracking-wide text-navy-400 uppercase">{children}</p>;
}

/**
 * A-01..A-06 + операционный превью очереди кейсов — аналитический дашборд в 3-слойной архитектуре
 * (ТЗ раздел 6, 8.5 + `JanarmAI_Analytics_Deep_Dive.docx`, разд. 3): стратегический слой (KPI с
 * дельтой и спарклайном) → тактический (тренды/структура) → операционный (конкретные кейсы).
 * Виджеты собраны на примитивах shadcn/ui (`Card`/`Table`/`Badge`/`Button`) поверх темы navy/orange.
 */
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const adminId = useAdminStore((s) => s.currentAdminId);
  const logout = useAdminStore((s) => s.logout);
  const admin = adminUsersSeed.find((a) => a.id === adminId);
  const cases = useCaseStore((s) => s.cases);
  const freshnessLabel = useDataFreshnessLabel();

  const latestConsumption = consumptionStructureSeed[consumptionStructureSeed.length - 1];
  const prevConsumption = consumptionStructureSeed[consumptionStructureSeed.length - 2];
  const nonresidentDeltaPp = Math.round((latestConsumption.nonresidentSharePct - prevConsumption.nonresidentSharePct) * 10) / 10;
  const NonresDeltaIcon = nonresidentDeltaPp >= 0 ? ArrowUpRight : ArrowDownRight;

  const topCases = [...cases].sort((a, b) => b.riskScore - a.riskScore).slice(0, OPERATIONAL_PREVIEW_SIZE);

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

      {/* Стратегический слой — A-01, 6 KPI с дельтой и спарклайном */}
      <section>
        <SectionLabel>Стратегический слой — всё штатно?</SectionLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpiSeed.map((kpi) => (
            <KpiTile
              key={kpi.id}
              label={kpi.label}
              formattedValue={kpi.formattedValue}
              secondaryLabel={kpi.secondaryLabel}
              deltaPct={kpi.deltaPct}
              comparisonLabel={kpi.comparisonLabel}
              goodDirection={kpi.goodDirection}
              sparkline={kpi.sparkline}
              valueTone={kpi.valueTone}
              onClick={kpi.id === 'open-high-risk-cases' ? () => navigate('/admin/cases') : undefined}
            />
          ))}
        </div>
      </section>

      {/* Тактический слой — A-02, A-03, A-04, A-05, A-06 */}
      <section className="space-y-6">
        <SectionLabel>Тактический слой — почему именно так</SectionLabel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Закуп по СНТ vs Фактические продажи</CardTitle>
              <CardDescription>млн л, по месяцам — разрыв сокращается по мере внедрения JanarmAI</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartLine
                data={monthlyLegalitySeed}
                xKey="month"
                series={[
                  { key: 'sntVolumeMlnL', label: 'Закуп по СНТ', color: chartCategorical.navy },
                  { key: 'salesVolumeMlnL', label: 'Фактические продажи', color: chartCategorical.orange },
                ]}
              />
              <Separator className="my-4" />
              <p className="mb-2 text-xs font-semibold text-navy-600">Разрыв по топ-5 контрагентам/сетям</p>
              <GapByCounterpartyList counterparties={legalityGapByCounterpartySeed} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Структура потребления</CardTitle>
              <CardDescription className="flex items-center gap-1">
                Доля нерезидентов: {latestConsumption.nonresidentSharePct}%
                <span className={`inline-flex items-center gap-0.5 font-semibold ${nonresidentDeltaPp >= 0 ? 'text-status-blocked' : 'text-status-ok'}`}>
                  <NonresDeltaIcon className="h-3 w-3" />
                  {Math.abs(nonresidentDeltaPp)} п.п. к пред. месяцу
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
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              <CardTitle>Индекс топливного туризма</CardTitle>
              <CardDescription>Доля отпуска нерезидентам: приграничные области vs внутренние регионы</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartBar
                data={fuelTourismSeed.map((g) => ({ group: g.group, share: g.nonresidentSharePct }))}
                xKey="group"
                series={[{ key: 'share', label: 'Доля нерезидентов, %', color: chartCategorical.orange }]}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Тепловая карта регионов РК</CardTitle>
            <CardDescription>Заливка — риск-уровень региона (severity), размер маркера города — объём</CardDescription>
          </CardHeader>
          <CardContent>
            <KzHeatMap data={regionConsumptionSeed} />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Классификатор аномалий</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {anomalyTaxonomySeed.map((point) => (
              <AnomalyCategoryCard key={point.type} point={point} />
            ))}
          </div>
        </div>
      </section>

      {/* Операционный слой — превью очереди кейсов (полный экран — A-07 /admin/cases) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Операционный слой — конкретные случаи для разбора</SectionLabel>
          <Button type="button" variant="link" size="sm" onClick={() => navigate('/admin/cases')} className="h-auto p-0">
            Вся очередь ({cases.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Риск</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Регион / АЗС</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Тип аномалии</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCases.map((c) => (
              <TableRow key={c.id} onClick={() => navigate(`/admin/cases/${c.id}`)} className="cursor-pointer">
                <TableCell>
                  <RiskBadge tier={c.riskTier} score={c.riskScore} />
                </TableCell>
                <TableCell className="tabular-nums text-navy-500">{formatCaseDate(c.dateTime)}</TableCell>
                <TableCell className="text-navy-700">
                  {c.region} · {c.stationName}
                </TableCell>
                <TableCell className="tabular-nums text-navy-500">{c.maskedId}</TableCell>
                <TableCell className="text-navy-700">{ANOMALY_TYPE_LABEL[c.anomalyType]}</TableCell>
                <TableCell>
                  <Badge variant={CASE_STATUS_BADGE_VARIANT[c.status]}>{CASE_STATUS_LABEL[c.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <p className="text-center text-xs text-navy-300">
        Данные актуальны на {freshnessLabel} · период сравнения KPI — 30 дней к прошлым 30 дням, помесячные виджеты — 12 месяцев
      </p>
    </div>
  );
}
