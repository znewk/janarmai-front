import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { geoMercator } from 'd3-geo';
import type { RegionConsumptionPoint } from '@/mocks/seed';
import { chartSequentialNavy } from '@/theme/colors';
import kzGeo from '@/mocks/geo/kz-oblasts.json';

export interface KzHeatMapProps {
  data: RegionConsumptionPoint[];
}

function bucketColor(value: number, min: number, max: number): string {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const index = Math.min(chartSequentialNavy.length - 1, Math.floor(ratio * chartSequentialNavy.length));
  return chartSequentialNavy[index];
}

/**
 * Проекция, автоматически вписывающая фактическую геометрию kz-oblasts.json в размер холста —
 * вместо подобранных вручную center/scale, которые не проверялись визуально и оказались завышены
 * (карта «зумилась» внутрь одного региона, см. PROGRESS.md). fitExtent пересчитывает масштаб
 * из реального bounding box геоданных, поэтому не ломается при смене источника геоданных.
 */
function fitKzProjection(width: number, height: number) {
  const padding = 16;
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    kzGeo as unknown as Parameters<ReturnType<typeof geoMercator>['fitExtent']>[1],
  );
}

/**
 * A-04 — интерактивная тепловая карта областей РК: заливка по индексу потребления, акцент на приграничные аномалии (ТЗ 6, 8.5).
 * Границы: geokz (github.com/arodionoff/geokz, CC BY 4.0), на основе UN OCHA COD-AB Kazakhstan, актуализация 2024 г. (20 регионов).
 */
export function KzHeatMap({ data }: KzHeatMapProps) {
  const [hovered, setHovered] = useState<RegionConsumptionPoint | null>(null);
  const byName = new Map(data.map((r) => [r.name, r]));
  const values = data.map((r) => r.consumptionIndex);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
      <div className="rounded-xl border border-navy-100 bg-white p-2">
        <ComposableMap projection={fitKzProjection} width={800} height={480} style={{ width: '100%', height: 'auto' }}>
          <Geographies geography={kzGeo}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const region = byName.get(geo.properties.name as string);
                const fill = region ? bucketColor(region.consumptionIndex, min, max) : '#e5e9f0';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => region && setHovered(region)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: { fill, stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none' },
                      hover: { fill: '#e05f0a', stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none' },
                      pressed: { fill: '#e05f0a', stroke: '#fcfcfb', strokeWidth: 0.75, outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        <div className="mt-2 flex items-center gap-2 px-2 text-xs text-navy-400">
          <span>Меньше потребление</span>
          <span className="flex h-2 flex-1 overflow-hidden rounded-full">
            {chartSequentialNavy.map((c) => (
              <span key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span>Больше</span>
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 bg-white p-4">
        {hovered ? (
          <div>
            <p className="font-semibold text-navy-900">{hovered.name}</p>
            <p className="mt-2 text-sm text-navy-500">
              Индекс потребления: <span className="font-semibold text-navy-900">{hovered.consumptionIndex}</span>
            </p>
            <p className="text-sm text-navy-500">
              Аномалия: <span className="font-semibold text-navy-900">{hovered.anomalyScore}</span>
            </p>
            {hovered.isBorderRegion && (
              <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                Приграничный регион
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-navy-400">Наведите на область, чтобы увидеть показатели.</p>
        )}
      </div>
    </div>
  );
}
