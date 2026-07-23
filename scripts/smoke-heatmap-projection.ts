/** Дымовой скрипт: проверка fitExtent-проекции тепловой карты без браузера (см. баг со «сплошным прямоугольником»). */
import { geoMercator, geoPath, geoBounds } from 'd3-geo';
import kzGeo from '../src/mocks/geo/kz-oblasts.json';

const WIDTH = 800;
const HEIGHT = 480;
const PADDING = 16;

function run() {
  const projection = geoMercator().fitExtent(
    [
      [PADDING, PADDING],
      [WIDTH - PADDING, HEIGHT - PADDING],
    ],
    kzGeo as never,
  );
  const path = geoPath(projection);

  console.log('=== Геопривязка (долгота/широта) ===');
  const [[lonMin, latMin], [lonMax, latMax]] = geoBounds(kzGeo as never);
  console.log(`lon: ${lonMin.toFixed(2)}..${lonMax.toFixed(2)} | lat: ${latMin.toFixed(2)}..${latMax.toFixed(2)}`);
  if (lonMax - lonMin < 10 || lonMax - lonMin > 60) throw new Error('FAIL: разброс долгот не похож на Казахстан (ожидалось ~25-45°)');

  console.log('\n=== Пиксельный bbox всей страны после fitExtent ===');
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let degenerateCount = 0;

  for (const feature of (kzGeo as { features: unknown[] }).features) {
    const bounds = path.bounds(feature as never);
    const [[x0, y0], [x1, y1]] = bounds;
    if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) {
      throw new Error(`FAIL: нечисловые координаты для региона ${JSON.stringify((feature as { properties: unknown }).properties)}`);
    }
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) degenerateCount += 1;
    // подозрение на баг «инверсии» — регион, который сам по себе занимает почти весь холст
    if (w > WIDTH * 0.9 && h > HEIGHT * 0.9) {
      throw new Error(`FAIL: регион ${(feature as { properties: { name: string } }).properties.name} занимает почти весь холст (${w.toFixed(0)}x${h.toFixed(0)}) — похоже на инверсию/неверный zoom`);
    }
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  }

  console.log(`overall bbox: x[${minX.toFixed(1)}, ${maxX.toFixed(1)}] y[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
  console.log('вырожденных (нулевой площади) регионов:', degenerateCount);
  if (degenerateCount > 0) throw new Error('FAIL: есть регионы с нулевой площадью в пикселях');

  const overallW = maxX - minX;
  const overallH = maxY - minY;
  console.log(`overall size: ${overallW.toFixed(0)} x ${overallH.toFixed(0)} (холст ${WIDTH}x${HEIGHT})`);
  if (overallW < WIDTH * 0.5 && overallH < HEIGHT * 0.5) throw new Error('FAIL: страна занимает слишком маленькую часть холста — карта выглядела бы точкой');
  if (overallW > WIDTH || overallH > HEIGHT) throw new Error('FAIL: bbox выходит за пределы холста — fitExtent работает некорректно');
  if (minX < 0 || minY < 0 || maxX > WIDTH || maxY > HEIGHT) throw new Error('FAIL: часть страны обрезана за пределами viewBox');

  console.log('\nВСЯ СТРАНА ПОМЕЩАЕТСЯ В ХОЛСТ БЕЗ ОБРЕЗКИ И БЕЗ ВЫРОЖДЕННЫХ РЕГИОНОВ — ПРОЕКЦИЯ КОРРЕКТНА.');
}

run();
