import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { KpiTile } from '@/components/ui/KpiTile';
import { ChartLine } from '@/components/ui/ChartLine';
import { ChartDonut } from '@/components/ui/ChartDonut';
import { ChartBar } from '@/components/ui/ChartBar';
import { KzHeatMap } from '@/components/ui/KzHeatMap';
import { RuleStatusCard } from '@/components/ui/RuleStatusCard';
import { chartCategorical } from '@/theme/colors';
import { adminUsersSeed, kpiSeed, monthlyLegalitySeed, stationNetworkStatsSeed, consumptionStructureSeed, regionConsumptionSeed, fuelTourismSeed, controlRulesSeed } from '@/mocks/seed';
import { useAdminStore } from '@/store/admin.store';

const DATA_FLOW_SOURCES = ['СНТ', 'ОФД', 'МВД', '«Беркут»', 'ЕСБД'];

/** A-01..A-06 — аналитический дашборд (ТЗ раздел 6, 8.5). Данные — сгенерированные, с сезонностью, не случайный шум. */
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const adminId = useAdminStore((s) => s.currentAdminId);
  const logout = useAdminStore((s) => s.logout);
  const admin = adminUsersSeed.find((a) => a.id === adminId);

  const latestConsumption = consumptionStructureSeed[consumptionStructureSeed.length - 1];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-navy-400">Оперативные показатели</p>
          <h1 className="text-2xl font-bold text-navy-900">Дашборд JanarmAI</h1>
        </div>
        <div className="text-right text-sm">
          {admin && (
            <p className="text-navy-500">
              {admin.fio} · {admin.role}
            </p>
          )}
          <button type="button" onClick={handleLogout} className="text-xs font-semibold text-navy-400 hover:text-navy-600">
            Выйти
          </button>
        </div>
      </div>

      {/* A-01 — KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Общий объём реализации" value={`${kpiSeed.totalRealizationMlnL} млн л`} />
        <KpiTile label="Предотвращён нелегальный вывоз" value={`${kpiSeed.preventedExportMlnL} млн л`} />
        <KpiTile label="Сохранённая субсидия" value={`${(kpiSeed.savedSubsidyKzt / 1_000_000).toFixed(0)} млн ₸`} />
        <KpiTile label="Индекс легальности рынка" value={`${kpiSeed.legalityIndexPct}%`} sublabel="за последний месяц" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* A-02 — сверка СНТ vs реализация */}
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-navy-700">Закуп по СНТ vs Фактические продажи</h2>
          <p className="mb-2 text-xs text-navy-400">млн л, по месяцам — разрыв сокращается по мере внедрения JanarmAI</p>
          <ChartLine
            data={monthlyLegalitySeed}
            xKey="month"
            series={[
              { key: 'sntVolumeMlnL', label: 'Закуп по СНТ', color: chartCategorical.navy },
              { key: 'salesVolumeMlnL', label: 'Фактические продажи', color: chartCategorical.orange },
            ]}
          />
        </div>

        {/* A-05 — структура потребления */}
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-navy-700">Структура потребления</h2>
          <p className="mb-2 text-xs text-navy-400">Доля нерезидентов растёт: {consumptionStructureSeed[0].nonresidentSharePct}% → {latestConsumption.nonresidentSharePct}%</p>
          <ChartDonut
            data={[
              { name: 'Резиденты', value: latestConsumption.residentSharePct, color: chartCategorical.navy },
              { name: 'Нерезиденты', value: latestConsumption.nonresidentSharePct, color: chartCategorical.orange },
            ]}
            centerValue={`${latestConsumption.residentSharePct}%`}
            centerLabel="резиденты"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* A-03 — рейтинг сетей АЗС */}
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-navy-700">Рейтинг сетей АЗС по «чистоте»</h2>
          <p className="mb-2 text-xs text-navy-400">Авторизации JanarmAI vs чеки ОФД — «Гелиос» показывает расхождение</p>
          <ChartBar
            data={stationNetworkStatsSeed}
            xKey="network"
            series={[
              { key: 'janarmaiAuthorizations', label: 'Авторизации JanarmAI', color: chartCategorical.navy },
              { key: 'ofdReceipts', label: 'Чеки ОФД', color: chartCategorical.orange },
            ]}
          />
        </div>

        {/* Индекс топливного туризма */}
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-navy-700">Индекс топливного туризма</h2>
          <p className="mb-2 text-xs text-navy-400">Доля отпуска нерезидентам: приграничные области vs внутренние регионы</p>
          <ChartBar
            data={fuelTourismSeed.map((g) => ({ group: g.group, share: g.nonresidentSharePct }))}
            xKey="group"
            series={[{ key: 'share', label: 'Доля нерезидентов, %', color: chartCategorical.orange }]}
          />
        </div>
      </div>

      {/* A-04 — тепловая карта */}
      <div className="rounded-xl border border-navy-100 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-navy-700">Тепловая карта регионов РК</h2>
        <p className="mb-3 text-xs text-navy-400">Потребление ГСМ и аномалии по областям — акцент на приграничные регионы</p>
        <KzHeatMap data={regionConsumptionSeed} />
      </div>

      {/* A-06 — интеллектуальный контроль */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-700">Интеллектуальный контроль</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {controlRulesSeed.map((rule) => (
            <RuleStatusCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      {/* Лента источников данных */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-navy-100 bg-navy-50 p-4 text-xs font-medium text-navy-500">
        {DATA_FLOW_SOURCES.map((source, i) => (
          <span key={source} className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">{source}</span>
            {i < DATA_FLOW_SOURCES.length - 1 && <ArrowRight className="h-3 w-3 text-navy-300" />}
          </span>
        ))}
        <ArrowRight className="h-3 w-3 text-navy-300" />
        <span className="rounded-full bg-navy-600 px-3 py-1 text-white shadow-sm">Ядро JanarmAI</span>
        <ArrowRight className="h-3 w-3 text-navy-300" />
        <span className="rounded-full bg-orange-500 px-3 py-1 text-white shadow-sm">BI-витрина</span>
      </div>
    </div>
  );
}
