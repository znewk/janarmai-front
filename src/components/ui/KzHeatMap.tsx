import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoMercator, geoCentroid } from 'd3-geo';
import { MapPin, TrendingUp, TrendingDown, Minus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { RegionConsumptionPoint, RegionFuelDailyFact } from '@/mocks/seed';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';
import { RISK_TIER_COLOR, RISK_TIER_LABEL } from '@/lib/riskTier';
import { computeRegionDetail, computeRegionSummaries, VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT, type DashboardFilters } from '@/lib/analyticsCompute';
import { TONE_ICON, TONE_TEXT, TONE_BG, REGION_STATUS_EXPLANATION, VOLUME_GROWTH_EXPLANATION } from '@/lib/shareToneUI';
import { SUMMARY_COLUMNS, sortSummaries, type SummarySortField } from '@/lib/regionSummaryTable';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '@/lib/utils';
import kzGeo from '@/mocks/geo/kz-oblasts.json';

export interface KzHeatMapProps {
  data: RegionConsumptionPoint[];
  facts: RegionFuelDailyFact[];
  filters: DashboardFilters;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 480;
const MAP_PADDING = 16;
const MARKER_MIN_RADIUS = 3;
const MARKER_MAX_RADIUS = 11;

const TONE_LABEL = { ok: 'Низкий', warning: 'Средний', critical: 'Высокий' } as const;

/**
 * Проекция, автоматически вписывающая фактическую геометрию kz-oblasts.json в размер холста —
 * вместо подобранных вручную center/scale, которые не проверялись визуально и оказались завышены
 * (карта «зумилась» внутрь одного региона, см. PROGRESS.md). fitExtent пересчитывает масштаб
 * из реального bounding box геоданных, поэтому не ломается при смене источника геоданных.
 *
 * ВАЖНО: `ComposableMap.projection` в установленной версии react-simple-maps (3.x), несмотря на
 * заявленный в @types/react-simple-maps тип `(width, height, config) => GeoProjection`, при передаче
 * функции использует её КАК ГОТОВЫЙ d3-проекции объект, а не вызывает как фабрику (см. makeProjection
 * в dist/index.es.js: `if (typeof projection === 'function') return projection`). Поэтому проекция
 * вычисляется здесь заранее (готовый d3-объект), а не передаётся функцией-фабрикой — иначе рантайм
 * пытается вызвать САМ ГОТОВЫЙ ОБЪЕКТ ПРОЕКЦИИ как точку (x=[lon,lat], y=undefined), что приводит
 * к `TypeError: r is not a function` при рендере (баг проявился только в браузере, см. PROGRESS.md).
 */
function useKzProjection() {
  return useMemo(
    () =>
      geoMercator().fitExtent(
        [
          [MAP_PADDING, MAP_PADDING],
          [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
        ],
        kzGeo as unknown as Parameters<ReturnType<typeof geoMercator>['fitExtent']>[1],
      ),
    [],
  );
}

/** Радиус маркера города, линейно от объёма (consumptionIndex как прокси) — в диапазоне [MIN, MAX]px. */
function markerRadius(value: number, min: number, max: number): number {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  return MARKER_MIN_RADIUS + ratio * (MARKER_MAX_RADIUS - MARKER_MIN_RADIUS);
}

/** Регион с наивысшим риск-баллом заливки карты — предвыбран по умолчанию, чтобы панель справа не пустовала до первого клика. */
function highestRiskRegion(data: RegionConsumptionPoint[]): string | null {
  if (data.length === 0) return null;
  return data.reduce((max, r) => (r.riskScore > max.riskScore ? r : max), data[0]).name;
}

/**
 * A-04 — интерактивная тепловая карта областей РК: заливка по severity (риск-тир региона, не
 * интенсивность потребления) + слой маркеров-городов, размер = объём. По замечанию ПМ тултип по
 * наведению заменён на клик + **постоянную** боковую панель (не исчезает при уходе курсора).
 *
 * Панель деталей считается целиком из `computeRegionDetail` (`analyticsCompute.ts`) — все числа
 * (ранг, доля от РК, статус региона) выводятся из тех же реальных тонн/процентов, что показаны
 * в самой панели, а не из отдельного непрозрачного `riskScore` (см. правки по замечанию: «как ты
 * высчитываешь эти баллы» — раньше ранг/доля считались от случайного `consumptionIndex`, статус —
 * от случайного `riskScore`, никак не связанных с реальными цифрами на этой же панели).
 *
 * Заливка САМОЙ КАРТЫ (цвет региона) по-прежнему берётся из `regionConsumptionSeed.riskTier`
 * (синтетический, для визуального разнообразия по всем 20 регионам сразу) — известное расхождение
 * с прозрачным статусом на панели детали, см. OPEN_QUESTIONS.md.
 *
 * Точка маркера — геометрический центроид полигона региона (в проекте нет датасета координат
 * областных центров — центроид достаточен для демо, см. допущение в OPEN_QUESTIONS.md).
 * Границы: geokz (github.com/arodionoff/geokz, CC BY 4.0), на основе UN OCHA COD-AB Kazakhstan.
 */
export function KzHeatMap({ data, facts, filters }: KzHeatMapProps) {
  const [selected, setSelected] = useState<string | null>(() => highestRiskRegion(data));
  const byName = useMemo(() => new Map(data.map((r) => [r.name, r])), [data]);
  const volumeValues = data.map((r) => r.consumptionIndex);
  const volumeMin = Math.min(...volumeValues);
  const volumeMax = Math.max(...volumeValues);
  const projection = useKzProjection();

  const [sortField, setSortField] = useState<SummarySortField>('volumeT');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const summaries = useMemo(() => computeRegionSummaries(facts, filters), [facts, filters]);
  const sortedSummaries = useMemo(() => sortSummaries(summaries, sortField, sortDir), [summaries, sortField, sortDir]);
  const handleSort = (field: SummarySortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'region' ? 'asc' : 'desc');
    }
  };

  const selectedRegion = selected ? byName.get(selected) : null;
  const detail = useMemo(() => (selected ? computeRegionDetail(facts, filters, selected) : null), [facts, filters, selected]);

  const geoFeatures = (kzGeo as unknown as { features: GeoJSON.Feature[] }).features;
  const centroids = useMemo(
    () =>
      geoFeatures.map((feature) => ({
        name: (feature.properties as { name: string }).name,
        centroid: geoCentroid(feature as never) as [number, number],
      })),
    [geoFeatures],
  );

  return (
    <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border border-navy-100 bg-white p-2">
        {/* @types/react-simple-maps типизирует `projection` как фабрику (width,height,config)=>GeoProjection,
            но рантайм этой версии ожидает готовый d3-объект проекции при передаче функции (см. useKzProjection) — cast намеренный. */}
        <ComposableMap projection={projection as never} width={MAP_WIDTH} height={MAP_HEIGHT} style={{ width: '100%', height: 'auto' }}>
          <Geographies geography={kzGeo}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name as string;
                const region = byName.get(name);
                const fill = region ? RISK_TIER_COLOR[region.riskTier] : '#e5e9f0';
                const isSelected = selected === name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => region && setSelected(name)}
                    style={{
                      default: { fill, fillOpacity: isSelected ? 0.85 : 0.55, stroke: isSelected ? '#0a1728' : '#fcfcfb', strokeWidth: isSelected ? 1.5 : 0.75, outline: 'none', cursor: 'pointer' },
                      hover: { fill, fillOpacity: 0.75, stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none', cursor: 'pointer' },
                      pressed: { fill, fillOpacity: 0.85, stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {centroids.map(({ name, centroid }) => {
            const region = byName.get(name);
            if (!region) return null;
            return (
              <Marker key={name} coordinates={centroid}>
                <circle
                  r={markerRadius(region.consumptionIndex, volumeMin, volumeMax)}
                  fill={RISK_TIER_COLOR[region.riskTier]}
                  stroke={selected === name ? '#0a1728' : '#fcfcfb'}
                  strokeWidth={selected === name ? 2 : 1.25}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(name)}
                />
              </Marker>
            );
          })}
        </ComposableMap>
        <div className="mt-2 flex flex-wrap items-center gap-3 px-2 text-xs text-navy-400">
          <span className="font-medium text-navy-500">Риск-уровень заливки карты:</span>
          {(['low', 'medium', 'high'] as const).map((tier) => (
            <span key={tier} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_TIER_COLOR[tier] }} />
              {RISK_TIER_LABEL[tier]}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-navy-300" />
            размер = объём
          </span>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-navy-100 bg-white p-4">
        {selectedRegion && detail ? (
          <div className="flex h-full flex-col">
            {/* Заголовок региона */}
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-600">
                <MapPin className="h-4 w-4 text-white" />
              </span>
              <p className="font-semibold text-navy-900">{selectedRegion.name}</p>
            </div>

            {/* Место среди регионов РК + статус (вместо непрозрачного риск-балла) */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-navy-50 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-navy-400 uppercase">Место по объёму</p>
                <p className="mt-0.5 text-4xl font-bold tabular-nums text-navy-900">
                  {detail.volumeRank}
                  <span className="text-base font-semibold text-navy-400"> / {detail.totalRegions}</span>
                </p>
                <p className="mt-1 text-[11px] text-navy-400">
                  {detail.totalVolumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т ·{' '}
                  {Math.round(detail.totalVolumeL).toLocaleString('ru-RU')} л · {detail.volumeSharePctOfRK}% от объёма РК
                </p>
              </div>
              <div className={`rounded-xl p-3 ${TONE_BG[detail.status]}`}>
                <p className={`flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase ${TONE_TEXT[detail.status]}`}>
                  {(() => {
                    const StatusIcon = TONE_ICON[detail.status];
                    return <StatusIcon className="h-3.5 w-3.5" />;
                  })()}
                  Статус региона
                  <InfoTooltip text={REGION_STATUS_EXPLANATION} />
                </p>
                <p className={`mt-0.5 text-3xl font-bold ${TONE_TEXT[detail.status]}`}>{TONE_LABEL[detail.status]}</p>
                <p className="text-[11px] text-navy-400">
                  по доле нерезидентам ({detail.nonresidentSharePct}%) и доле сверх лимита ({detail.overLimitVolumeSharePct}%)
                </p>
              </div>
            </div>

            {/* Рост объёма к пред. периоду — намеренно НЕ окрашен как риск: быстрый рост может быть легитимным сезонным спросом */}
            <div className="mt-2 rounded-xl bg-blue-50 p-3">
              <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-blue-700 uppercase">
                {detail.volumeDeltaPct > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : detail.volumeDeltaPct < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                Рост объёма к пред. периоду
                <InfoTooltip text={VOLUME_GROWTH_EXPLANATION} />
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-blue-600">
                {detail.volumeDeltaPct > 0 ? '+' : ''}
                {detail.volumeDeltaPct}%
                {detail.volumeDeltaPct >= VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT && (
                  <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-blue-700">возможен сезонный спрос</span>
                )}
              </p>
              <p className="mt-1 text-[11px] text-navy-400">Не показатель нарушения — стоит рассматривать вместе со статусом, а не как отдельный риск.</p>
            </div>

            {/* Объём по маркам топлива — с прогресс-барами вместо голого списка */}
            <p className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-navy-400 uppercase">
              <TrendingUp className="h-3.5 w-3.5" />
              Объём по маркам
            </p>
            <ul className="space-y-2.5">
              {detail.fuelBreakdown.map((f) => {
                const sharePct = detail.totalVolumeT > 0 ? Math.round((f.volumeT / detail.totalVolumeT) * 1000) / 10 : 0;
                return (
                  <li key={f.fuelType}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy-500">{FUEL_TYPE_LABEL[f.fuelType]}</span>
                      <span className="text-right">
                        <span className="font-semibold tabular-nums text-navy-900">
                          {f.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т
                        </span>
                        <span className="ml-1.5 text-[11px] text-navy-400">{Math.round(f.volumeL).toLocaleString('ru-RU')} л</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                      <div className="h-full rounded-full bg-navy-500" style={{ width: `${sharePct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex items-center justify-between text-xs text-navy-400">
              <span>Итого</span>
              <span>
                <span className="font-semibold text-navy-600">{detail.totalVolumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т</span>
                <span className="ml-1.5 text-navy-400">{Math.round(detail.totalVolumeL).toLocaleString('ru-RU')} л</span>
              </span>
            </div>

            {/* Ключевые доли — с абсолютными цифрами, не только процент */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-navy-100 pt-4">
              <div className="rounded-xl bg-orange-50 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-orange-700 uppercase">Нерезидентам</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-orange-600">{detail.nonresidentSharePct}%</p>
                <p className="text-[11px] text-navy-400">
                  {detail.nonresidentVolumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т отпущено нерезидентам
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-orange-700 uppercase">Сверх лимита</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-orange-600">{detail.overLimitVolumeSharePct}%</p>
                <p className="text-[11px] text-navy-400">
                  {detail.overLimitVolumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т · {detail.overLimitOpsCount} из {detail.overLimitTotalOpsCount} операций
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-navy-400">Выберите область или маркер на карте, чтобы увидеть показатели по региону.</p>
        )}
      </div>
    </div>

    <div className="rounded-xl border border-navy-100 bg-white p-4">
      <p className="text-sm font-semibold text-navy-900">Сводная таблица по регионам</p>
      <p className="mb-3 text-xs text-navy-400">Клик по строке — показать регион на карте и в панели выше. Клик по заголовку столбца — сортировка.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-navy-400 uppercase">#</th>
              {SUMMARY_COLUMNS.map((col) => {
                const active = sortField === col.field;
                const SortIcon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className={cn(
                      'cursor-pointer select-none px-3 py-2 text-[11px] font-semibold tracking-wide text-navy-400 uppercase hover:text-navy-600',
                      col.field !== 'region' && 'text-right',
                    )}
                  >
                    <span className={cn('inline-flex items-center gap-1', col.field !== 'region' && 'flex-row-reverse')}>
                      {col.label}
                      <SortIcon className={cn('h-3 w-3', active && 'text-orange-600')} />
                      {col.field === 'status' && <InfoTooltip text={REGION_STATUS_EXPLANATION} />}
                      {col.field === 'volumeDeltaPct' && <InfoTooltip text={VOLUME_GROWTH_EXPLANATION} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedSummaries.map((row) => {
              const StatusIcon = TONE_ICON[row.status];
              const isSelected = selected === row.region;
              return (
                <tr
                  key={row.region}
                  onClick={() => setSelected(row.region)}
                  className={cn('cursor-pointer border-t border-navy-50 text-sm hover:bg-navy-50/60', isSelected && 'bg-orange-50 hover:bg-orange-50')}
                >
                  <td className="px-3 py-2 text-navy-400">{row.rank}</td>
                  <td className="px-3 py-2 font-medium text-navy-900">{row.region}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="font-semibold text-navy-900">
                      {row.volumeT.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} т
                    </span>
                    <span className="ml-1.5 text-[11px] text-navy-400">{Math.round(row.volumeL).toLocaleString('ru-RU')} л</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-navy-600">{row.volumeSharePctOfRK}%</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {(() => {
                      const notable = row.volumeDeltaPct >= VOLUME_GROWTH_NOTABLE_THRESHOLD_PCT;
                      const GrowthIcon = row.volumeDeltaPct > 0 ? TrendingUp : row.volumeDeltaPct < 0 ? TrendingDown : Minus;
                      return (
                        <span className={cn('inline-flex items-center gap-1 font-semibold', notable ? 'text-blue-600' : 'text-navy-500')}>
                          <GrowthIcon className="h-3.5 w-3.5" />
                          {row.volumeDeltaPct > 0 ? '+' : ''}
                          {row.volumeDeltaPct}%
                          {notable && <span className="ml-0.5 rounded bg-blue-50 px-1 py-0.5 text-[10px] font-semibold whitespace-nowrap text-blue-600">спрос?</span>}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-navy-600">{row.nonresidentSharePct}%</td>
                  <td className="px-3 py-2 text-right tabular-nums text-navy-600">{row.overLimitSharePct}%</td>
                  <td className="px-3 py-2 text-right">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', TONE_TEXT[row.status])}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {TONE_LABEL[row.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
