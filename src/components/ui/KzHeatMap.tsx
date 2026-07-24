import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoMercator, geoCentroid } from 'd3-geo';
import type { RegionConsumptionPoint } from '@/mocks/seed';
import { RISK_TIER_COLOR, RISK_TIER_LABEL } from '@/lib/riskTier';
import { RiskBadge } from './RiskBadge';
import kzGeo from '@/mocks/geo/kz-oblasts.json';

export interface KzHeatMapProps {
  data: RegionConsumptionPoint[];
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 480;
const MAP_PADDING = 16;
const MARKER_MIN_RADIUS = 3;
const MARKER_MAX_RADIUS = 11;

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

/**
 * A-04 — интерактивная тепловая карта областей РК: заливка по severity (риск-тир региона, не
 * интенсивность потребления) + слой маркеров-городов, размер = объём (Analytics Deep Dive 4.2).
 * Точка маркера — геометрический центроид полигона региона (в проекте нет датасета координат
 * областных центров — центроид достаточен для демо, см. допущение в OPEN_QUESTIONS.md).
 * Границы: geokz (github.com/arodionoff/geokz, CC BY 4.0), на основе UN OCHA COD-AB Kazakhstan.
 */
export function KzHeatMap({ data }: KzHeatMapProps) {
  const [hovered, setHovered] = useState<RegionConsumptionPoint | null>(null);
  const byName = useMemo(() => new Map(data.map((r) => [r.name, r])), [data]);
  const volumeValues = data.map((r) => r.consumptionIndex);
  const volumeMin = Math.min(...volumeValues);
  const volumeMax = Math.max(...volumeValues);
  const projection = useKzProjection();

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border border-navy-100 bg-white p-2">
        {/* @types/react-simple-maps типизирует `projection` как фабрику (width,height,config)=>GeoProjection,
            но рантайм этой версии ожидает готовый d3-объект проекции при передаче функции (см. useKzProjection) — cast намеренный. */}
        <ComposableMap projection={projection as never} width={MAP_WIDTH} height={MAP_HEIGHT} style={{ width: '100%', height: 'auto' }}>
          <Geographies geography={kzGeo}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const region = byName.get(geo.properties.name as string);
                const fill = region ? RISK_TIER_COLOR[region.riskTier] : '#e5e9f0';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => region && setHovered(region)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: { fill, fillOpacity: 0.55, stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none' },
                      hover: { fill, fillOpacity: 0.85, stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none' },
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
                  stroke="#fcfcfb"
                  strokeWidth={1.25}
                  onMouseEnter={() => setHovered(region)}
                  onMouseLeave={() => setHovered(null)}
                />
              </Marker>
            );
          })}
        </ComposableMap>
        <div className="mt-2 flex flex-wrap items-center gap-3 px-2 text-xs text-navy-400">
          <span className="font-medium text-navy-500">Риск-уровень:</span>
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

      <div className="rounded-xl border border-navy-100 bg-white p-4">
        {hovered ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">{hovered.name}</p>
              <RiskBadge tier={hovered.riskTier} score={hovered.riskScore} />
            </div>
            <p className="mt-2 text-sm text-navy-500">
              Индекс потребления (объём): <span className="font-semibold text-navy-900">{hovered.consumptionIndex}</span>
            </p>
            <p className="text-sm text-navy-500">
              Доля нерезидентов: <span className="font-semibold text-navy-900">{hovered.nonresidentSharePct}%</span>
            </p>
            {hovered.isBorderRegion && (
              <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                Приграничный регион
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-navy-400">Наведите на область или маркер, чтобы увидеть показатели.</p>
        )}
      </div>
    </div>
  );
}
