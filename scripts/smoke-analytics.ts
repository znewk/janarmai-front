/** Дымовой скрипт аналитического модуля: фактовая таблица, главные показатели, классификатор, фильтры, GeoJSON. */
import kzGeo from '../src/mocks/geo/kz-oblasts.json';

function isSuspiciouslyRound(n: number): boolean {
  return n !== 0 && n % 1000 === 0;
}

async function run() {
  const { regionConsumptionSeed, consumptionStructureSeed, stationNetworkStatsSeed, procurementGapByCounterpartySeed, KZ_REGION_NAMES } = await import(
    '../src/mocks/seed'
  );
  const { regionFuelFactsSeed, FACT_DATES, FACTS_DAYS, FUEL_TYPES } = await import('../src/mocks/seed/regionFuelFacts.seed');
  const {
    DEFAULT_FILTERS,
    computeFuelBreakdown,
    computeSunpReconciliation,
    computeNonresidentShare,
    computeOverLimitShare,
    computeAnomalyClassifier,
    computeRegionDetail,
    previousPeriodRange,
  } = await import('../src/lib/analyticsCompute');
  const { riskTierOf } = await import('../src/lib/riskTier');
  const { FUEL_DENSITY_T_PER_M3, litersToTons } = await import('../src/lib/fuelDensity');

  console.log('=== Проверка соответствия названий регионов GeoJSON <-> seed ===');
  const geoNames = new Set((kzGeo as { features: { properties: { name: string } }[] }).features.map((f) => f.properties.name));
  const seedNames = regionConsumptionSeed.map((r: { name: string }) => r.name);
  const missingInGeo = seedNames.filter((n: string) => !geoNames.has(n));
  const missingInSeed = Array.from(geoNames).filter((n) => !seedNames.includes(n));
  console.log('регионов в GeoJSON:', geoNames.size, '| регионов в seed:', seedNames.length);
  if (missingInGeo.length > 0 || missingInSeed.length > 0) throw new Error('FAIL: названия регионов не совпадают — тепловая карта не подсветит эти области');

  console.log('\n=== Фактовая таблица (regionFuelFactsSeed) — грануле день×регион×марка ===');
  console.log('строк:', regionFuelFactsSeed.length, '| ожидалось:', FACTS_DAYS * KZ_REGION_NAMES.length * FUEL_TYPES.length);
  if (regionFuelFactsSeed.length !== FACTS_DAYS * KZ_REGION_NAMES.length * FUEL_TYPES.length) throw new Error('FAIL: неверное число строк фактовой таблицы');
  console.log('дат:', FACT_DATES.length, '| марок:', FUEL_TYPES.length, '| последняя дата:', FACT_DATES[FACT_DATES.length - 1]);
  const everyRowHasDims = regionFuelFactsSeed.every(
    (r: { region: string; fuelType: string; date: string }) => KZ_REGION_NAMES.includes(r.region) && FUEL_TYPES.includes(r.fuelType as never) && !!r.date,
  );
  console.log('у каждой строки есть регион+марка+дата:', everyRowHasDims);
  if (!everyRowHasDims) throw new Error('FAIL: не у всех строк заполнены регион/марка/дата — фильтры не смогут по ним работать');
  const priceSplitConsistent = regionFuelFactsSeed.every((r: { volumeL: number; marketVolumeL: number; preferentialVolumeL: number }) => r.marketVolumeL + r.preferentialVolumeL === r.volumeL);
  console.log('market+preferential === volumeL по всем строкам:', priceSplitConsistent);
  if (!priceSplitConsistent) throw new Error('FAIL: разбивка по priceType (market/preferential) не сходится с общим объёмом');
  const nonresNeverExceeds = regionFuelFactsSeed.every((r: { volumeL: number; nonresidentVolumeL: number }) => r.nonresidentVolumeL <= r.volumeL);
  console.log('nonresidentVolumeL никогда не превышает volumeL:', nonresNeverExceeds);
  if (!nonresNeverExceeds) throw new Error('FAIL: доля нерезидентов не может физически превышать общий объём');
  const purchaseAlwaysGteVolume = regionFuelFactsSeed.every((r: { volumeL: number; purchaseVolumeL: number }) => r.purchaseVolumeL >= r.volumeL);
  console.log('закуп по СУНП всегда >= факта:', purchaseAlwaysGteVolume);
  if (!purchaseAlwaysGteVolume) throw new Error('FAIL: закуп по СУНП должен быть >= фактической реализации (разрыв, а не наоборот)');

  console.log('\n=== Плотность топлива — коэффициенты и конверсия ===');
  console.log(FUEL_DENSITY_T_PER_M3);
  if (Object.keys(FUEL_DENSITY_T_PER_M3).length !== 6) throw new Error('FAIL: ожидалось 6 марок топлива (АИ-92/95/98/100, ДТ летнее/зимнее)');
  const testTons = litersToTons(1000, 'dt_summer');
  console.log('1000 л ДТ (летнее) =', testTons, 'т (ожидалось 0.84)');
  if (Math.abs(testTons - 0.84) > 1e-9) throw new Error('FAIL: неверная конверсия литров в тонны для ДТ (летнее)');

  console.log('\n=== Главный показатель №1 — объём по маркам топлива (тонны) ===');
  const fuelBreakdown = computeFuelBreakdown(regionFuelFactsSeed, DEFAULT_FILTERS);
  console.log(fuelBreakdown.map((f: { fuelType: string; volumeT: number; deltaPct: number }) => `${f.fuelType}: ${f.volumeT.toFixed(1)} т (${f.deltaPct >= 0 ? '+' : ''}${f.deltaPct}%)`));
  if (fuelBreakdown.length !== 6) throw new Error('FAIL: ожидалось 6 марок в разбивке по умолчанию (фильтр марки = «все»)');
  if (fuelBreakdown.some((f: { volumeT: number }) => f.volumeT <= 0)) throw new Error('FAIL: объём по каждой марке должен быть положительным за 30-дневный период по умолчанию');
  const totalT = fuelBreakdown.reduce((s: number, f: { volumeT: number }) => s + f.volumeT, 0);
  console.log('объём не круглое число:', !isSuspiciouslyRound(Math.round(totalT * 10)));

  console.log('\n=== Главный показатель №2 — «Сверка с СУНП» ===');
  const sunp = computeSunpReconciliation(regionFuelFactsSeed, DEFAULT_FILTERS);
  console.log(`закуп: ${sunp.purchaseT.toFixed(0)} т, факт: ${sunp.realizedT.toFixed(0)} т, соотношение: ${sunp.ratioPct}%, тренд: ${sunp.weeklyTrend.length} точек`);
  if (sunp.ratioPct <= 0 || sunp.ratioPct > 100) throw new Error('FAIL: соотношение факт/закуп должно быть в диапазоне (0, 100]%');
  if (sunp.purchaseT < sunp.realizedT) throw new Error('FAIL: закуп по СУНП не может быть меньше факта');
  if (sunp.weeklyTrend.length < 3) throw new Error('FAIL: ожидался понедельный тренд минимум из нескольких точек за 30-дневный период');

  console.log('\n=== Главный показатель №3 — доля нерезидентам (по объёму отпусков) ===');
  const nonres = computeNonresidentShare(regionFuelFactsSeed, DEFAULT_FILTERS);
  console.log(`доля: ${nonres.sharePct}%, дельта: ${nonres.deltaPct}%, тренд: ${nonres.trend.length} точек`);
  if (nonres.sharePct <= 0 || nonres.sharePct >= 100) throw new Error('FAIL: доля нерезидентов должна быть в разумном диапазоне (0,100)');
  const nonresBorder = computeNonresidentShare(regionFuelFactsSeed, { ...DEFAULT_FILTERS, region: 'Атырауская' });
  const nonresInterior = computeNonresidentShare(regionFuelFactsSeed, { ...DEFAULT_FILTERS, region: 'Улытауская' });
  console.log(`приграничный регион (Атырауская): ${nonresBorder.sharePct}% vs внутренний (Улытауская): ${nonresInterior.sharePct}%`);
  if (nonresBorder.sharePct <= nonresInterior.sharePct) throw new Error('FAIL: приграничный регион повышенного риска должен иметь заметно более высокую долю нерезидентов, чем внутренний');

  console.log('\n=== Главный показатель №4 — доля операций сверх лимита ===');
  const overLimit = computeOverLimitShare(regionFuelFactsSeed, DEFAULT_FILTERS);
  console.log(`по объёму: ${overLimit.volumeSharePct}%, по кол-ву операций: ${overLimit.opsSharePct}%, дельта: ${overLimit.deltaPct}%`);
  if (overLimit.volumeSharePct <= 0) throw new Error('FAIL: доля сверх лимита по объёму должна быть положительной (есть намеренно завышенные регионы в seed)');
  const overLimitHot = computeOverLimitShare(regionFuelFactsSeed, { ...DEFAULT_FILTERS, region: 'Мангистауская' });
  const overLimitCold = computeOverLimitShare(regionFuelFactsSeed, { ...DEFAULT_FILTERS, region: 'Акмолинская' });
  console.log(`регион с намеренно завышенной долей (Мангистауская): ${overLimitHot.volumeSharePct}% vs обычный (Акмолинская): ${overLimitCold.volumeSharePct}%`);
  if (overLimitHot.volumeSharePct <= overLimitCold.volumeSharePct) throw new Error('FAIL: намеренно завышенный регион должен иметь заметно более высокую долю сверх лимита');

  console.log('\n=== Фильтры реально сужают данные (регион/марка/резидентство) ===');
  const allRegionsFuel = computeFuelBreakdown(regionFuelFactsSeed, DEFAULT_FILTERS);
  const oneRegionFuel = computeFuelBreakdown(regionFuelFactsSeed, { ...DEFAULT_FILTERS, region: 'Алматы' });
  const totalAll = allRegionsFuel.reduce((s: number, f: { volumeT: number }) => s + f.volumeT, 0);
  const totalOne = oneRegionFuel.reduce((s: number, f: { volumeT: number }) => s + f.volumeT, 0);
  console.log(`объём всех регионов: ${totalAll.toFixed(0)} т, объём одного региона (Алматы): ${totalOne.toFixed(0)} т`);
  if (totalOne >= totalAll) throw new Error('FAIL: фильтр по одному региону должен давать заметно меньший суммарный объём, чем «все регионы»');
  const oneFuel = computeFuelBreakdown(regionFuelFactsSeed, { ...DEFAULT_FILTERS, fuelType: 'ai98' });
  console.log('фильтр по одной марке возвращает только эту марку:', oneFuel.length === 1 && oneFuel[0].fuelType === 'ai98');
  if (oneFuel.length !== 1 || oneFuel[0].fuelType !== 'ai98') throw new Error('FAIL: фильтр по марке топлива должен сужать разбивку до одной записи');
  const residentOnly = computeNonresidentShare(regionFuelFactsSeed, { ...DEFAULT_FILTERS, residency: 'resident' });
  const nonresidentOnly = computeNonresidentShare(regionFuelFactsSeed, { ...DEFAULT_FILTERS, residency: 'nonresident' });
  console.log(`доля нерезидентов при фильтре «резиденты»: ${residentOnly.sharePct}% (ожидается 0), при «нерезиденты»: ${nonresidentOnly.sharePct}% (ожидается 100)`);
  if (residentOnly.sharePct !== 0) throw new Error('FAIL: при фильтре «только резиденты» доля нерезидентов в выборке должна быть строго 0 — иначе фильтр математически не работает (числитель/знаменатель сокращаются)');
  if (nonresidentOnly.sharePct !== 100) throw new Error('FAIL: при фильтре «только нерезиденты» доля нерезидентов в выборке должна быть строго 100%');

  console.log('\n=== Боковая панель тепловой карты (детали региона) ===');
  const detail = computeRegionDetail(regionFuelFactsSeed, DEFAULT_FILTERS, 'Костанайская');
  console.log(`регион: ${detail.region}, доля нерезидентов: ${detail.nonresidentSharePct}%, доля сверх лимита: ${detail.overLimitVolumeSharePct}%, марок в разбивке: ${detail.fuelBreakdown.length}`);
  if (detail.fuelBreakdown.length !== 6) throw new Error('FAIL: боковая панель должна показывать разбивку по всем 6 маркам топлива по умолчанию');

  console.log('\n=== Классификатор аномалий — 3 категории ===');
  const anomalies = computeAnomalyClassifier(regionFuelFactsSeed, DEFAULT_FILTERS);
  console.log(anomalies.map((a: { category: string; currentCount: number; priorPeriodCount: number }) => `${a.category}: ${a.currentCount} (было ${a.priorPeriodCount})`));
  if (anomalies.length !== 3) throw new Error('FAIL: ожидалось ровно 3 категории классификатора (по замечанию ПМ)');
  const dropoff = anomalies.find((a: { category: string }) => a.category === 'fuel_dropoff')!;
  console.log('«резкий отток марки топлива» находит намеренно заниженные (регион,марка) пары:', dropoff.currentCount);
  if (dropoff.currentCount < 1) throw new Error('FAIL: классификатор должен обнаружить хотя бы один из 2 намеренно заниженных случаев в seed (Костанайская/АИ-95, Туркестанская/ДТ)');
  const spike = anomalies.find((a: { category: string }) => a.category === 'nonresident_spike')!;
  console.log('«аномально высокая доля нерезидентам» находит приграничные регионы повышенного риска:', spike.currentCount);
  if (spike.currentCount < 2) throw new Error('FAIL: классификатор должен обнаружить хотя бы 2 из 3 регионов повышенного риска (Атырауская/ЗКО/Актюбинская)');
  const overLimitCategory = anomalies.find((a: { category: string }) => a.category === 'over_limit_share')!;
  console.log('«повышенная доля сверх лимита» находит намеренно завышенные регионы:', overLimitCategory.currentCount);
  if (overLimitCategory.currentCount < 1) throw new Error('FAIL: классификатор должен обнаружить хотя бы один из 2 намеренно завышенных регионов (Мангистауская/Кызылординская)');

  console.log('\n=== Регионы: риск-тир согласован с риск-баллом ===');
  const tierMismatch = regionConsumptionSeed.filter((r: { riskScore: number; riskTier: string }) => riskTierOf(r.riskScore) !== r.riskTier);
  console.log('riskTier согласован с riskTierOf(riskScore) по всем регионам:', tierMismatch.length === 0);
  if (tierMismatch.length > 0) throw new Error('FAIL: riskTier не совпадает с riskTierOf(riskScore)');

  console.log('\n=== Структура потребления (снимок) ===');
  const structureSumsTo100 = consumptionStructureSeed.every((p: { residentSharePct: number; nonresidentSharePct: number }) => Math.abs(p.residentSharePct + p.nonresidentSharePct - 100) < 0.01);
  console.log('доли резидентов+нерезидентов = 100% в каждом месяце:', structureSumsTo100);
  if (!structureSumsTo100) throw new Error('FAIL: доли должны суммироваться в 100%');

  console.log('\n=== Рейтинг сетей АЗС — риск-балл ===');
  const networkRiskInRange = stationNetworkStatsSeed.every((s: { riskScore: number }) => s.riskScore >= 0 && s.riskScore <= 100);
  if (!networkRiskInRange) throw new Error('FAIL: риск-балл сети должен быть в диапазоне 0–100');
  const networkSortedDesc = stationNetworkStatsSeed.every((s: { riskScore: number }, i: number, arr: { riskScore: number }[]) => i === 0 || arr[i - 1].riskScore >= s.riskScore);
  if (!networkSortedDesc) throw new Error('FAIL: рейтинг сетей должен быть отсортирован по убыванию риск-балла');

  console.log('\n=== Разрыв по топ-5 контрагентам (СУНП) ===');
  if (procurementGapByCounterpartySeed.length !== 5) throw new Error('FAIL: ожидалось ровно 5 контрагентов');
  const gapSorted = procurementGapByCounterpartySeed.every((c: { gapSharePct: number }, i: number, arr: { gapSharePct: number }[]) => i === 0 || arr[i - 1].gapSharePct >= c.gapSharePct);
  if (!gapSorted) throw new Error('FAIL: список контрагентов должен быть отсортирован по убыванию доли разрыва');

  console.log('\n=== previousPeriodRange — соседний период той же длины ===');
  const prev = previousPeriodRange('2026-06-22', '2026-07-21');
  console.log(prev);
  if (prev.dateTo !== '2026-06-21' || prev.dateFrom !== '2026-05-23') throw new Error('FAIL: предыдущий период должен быть той же длины и вплотную примыкать к текущему');

  console.log('\nВСЕ ПРОВЕРКИ АНАЛИТИЧЕСКИХ ДАННЫХ ПРОЙДЕНЫ УСПЕШНО.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
