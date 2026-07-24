/** Дымовой скрипт аналитического модуля: seed-данные, GeoJSON, риск-модель, очередь кейсов (Analytics Deep Dive). */
import kzGeo from '../src/mocks/geo/kz-oblasts.json';

function isSuspiciouslyRound(n: number): boolean {
  return n !== 0 && n % 1000 === 0;
}

async function run() {
  const {
    regionConsumptionSeed,
    monthlyLegalitySeed,
    legalityGapByCounterpartySeed,
    consumptionStructureSeed,
    stationNetworkStatsSeed,
    anomalyTaxonomySeed,
    kpiSeed,
    kpiDerived,
    fuelTourismSeed,
  } = await import('../src/mocks/seed/analytics.seed');
  const { casesSeed } = await import('../src/mocks/seed/cases.seed');
  const { riskTierOf } = await import('../src/lib/riskTier');

  console.log('=== Проверка соответствия названий регионов GeoJSON <-> seed ===');
  const geoNames = new Set((kzGeo as { features: { properties: { name: string } }[] }).features.map((f) => f.properties.name));
  const seedNames = regionConsumptionSeed.map((r) => r.name);
  const missingInGeo = seedNames.filter((n) => !geoNames.has(n));
  const missingInSeed = Array.from(geoNames).filter((n) => !seedNames.includes(n));
  console.log('регионов в GeoJSON:', geoNames.size, '| регионов в seed:', seedNames.length);
  if (missingInGeo.length > 0 || missingInSeed.length > 0) throw new Error('FAIL: названия регионов не совпадают — тепловая карта не подсветит эти области');

  console.log('\n=== Сезонность и выброс: СНТ vs Продажи ===');
  console.log('месяцев:', monthlyLegalitySeed.length);
  if (monthlyLegalitySeed.length !== 12) throw new Error('FAIL: ожидалось 12 месяцев');
  const salesNeverExceedSnt = monthlyLegalitySeed.every((m) => m.salesVolumeMlnL <= m.sntVolumeMlnL);
  console.log('продажи никогда не превышают закуп:', salesNeverExceedSnt);
  if (!salesNeverExceedSnt) throw new Error('FAIL: продажи не могут превышать физический закуп по СНТ');
  const legalityGrows = monthlyLegalitySeed[11].legalityIndexPct > monthlyLegalitySeed[0].legalityIndexPct;
  console.log('индекс легальности растёт к концу периода:', legalityGrows, `(${monthlyLegalitySeed[0].legalityIndexPct}% -> ${monthlyLegalitySeed[11].legalityIndexPct}%)`);
  if (!legalityGrows) throw new Error('FAIL: ожидался рост индекса легальности за период в целом');
  const hasAnomalyDip = monthlyLegalitySeed[4].legalityIndexPct < monthlyLegalitySeed[3].legalityIndexPct - 5;
  console.log('есть выброс (провал легальности в декабре):', hasAnomalyDip, `(${monthlyLegalitySeed[3].month}=${monthlyLegalitySeed[3].legalityIndexPct}% -> ${monthlyLegalitySeed[4].month}=${monthlyLegalitySeed[4].legalityIndexPct}%)`);
  if (!hasAnomalyDip) throw new Error('FAIL: ожидался хотя бы один аномальный выброс в ряде (Deep Dive, разд. 5)');
  const notRound = monthlyLegalitySeed.some((m) => !Number.isInteger(m.sntVolumeMlnL));
  console.log('значения не круглые (есть дробные):', notRound);
  if (!notRound) throw new Error('FAIL: ожидались нецелые «шумные» значения, а не круглые числа');

  console.log('\n=== Разложение разрыва по топ-5 контрагентам ===');
  console.log('контрагентов:', legalityGapByCounterpartySeed.length);
  if (legalityGapByCounterpartySeed.length !== 5) throw new Error('FAIL: ожидалось ровно 5 контрагентов');
  const gapSorted = legalityGapByCounterpartySeed.every((c, i, arr) => i === 0 || arr[i - 1].gapSharePct >= c.gapSharePct);
  console.log('отсортировано по убыванию доли:', gapSorted);
  if (!gapSorted) throw new Error('FAIL: список контрагентов должен быть отсортирован по убыванию доли разрыва');
  const gapShareSum = Math.round(legalityGapByCounterpartySeed.reduce((s, c) => s + c.gapSharePct, 0));
  console.log('сумма долей ≈ 100%:', gapShareSum);
  if (Math.abs(gapShareSum - 100) > 1) throw new Error('FAIL: доли контрагентов должны суммироваться примерно в 100%');

  console.log('\n=== Структура потребления ===');
  const structureSumsTo100 = consumptionStructureSeed.every((p) => Math.abs(p.residentSharePct + p.nonresidentSharePct - 100) < 0.01);
  console.log('доли резидентов+нерезидентов = 100% в каждом месяце:', structureSumsTo100);
  if (!structureSumsTo100) throw new Error('FAIL: доли должны суммироваться в 100%');

  console.log('\n=== Рейтинг сетей АЗС — риск-балл ===');
  console.log(stationNetworkStatsSeed.map((s) => `${s.network}: auth=${s.janarmaiAuthorizations} ofd=${s.ofdReceipts} risk=${s.riskScore}`));
  const networkRiskInRange = stationNetworkStatsSeed.every((s) => s.riskScore >= 0 && s.riskScore <= 100);
  if (!networkRiskInRange) throw new Error('FAIL: риск-балл сети должен быть в диапазоне 0–100');
  const networkSortedDesc = stationNetworkStatsSeed.every((s, i, arr) => i === 0 || arr[i - 1].riskScore >= s.riskScore);
  console.log('отсортировано по убыванию риска:', networkSortedDesc);
  if (!networkSortedDesc) throw new Error('FAIL: рейтинг сетей должен быть отсортирован по убыванию риск-балла');
  const helios = stationNetworkStatsSeed.find((s) => s.network === 'Гелиос')!;
  console.log('«Гелиос» — сеть с наивысшим риском:', helios.riskScore === stationNetworkStatsSeed[0].riskScore);
  if (helios.riskScore !== stationNetworkStatsSeed[0].riskScore) throw new Error('FAIL: ожидалась демонстрационная аномалия у «Гелиос» (наибольший риск-балл)');

  console.log('\n=== Индекс топливного туризма ===');
  console.log(fuelTourismSeed);
  if (fuelTourismSeed[0].nonresidentSharePct <= fuelTourismSeed[1].nonresidentSharePct) throw new Error('FAIL: в приграничных регионах доля нерезидентов должна быть выше');

  console.log('\n=== Регионы: риск-тир + неравномерная доля нерезидентов ===');
  const tierMismatch = regionConsumptionSeed.filter((r) => riskTierOf(r.riskScore) !== r.riskTier);
  console.log('riskTier согласован с riskScore по всем регионам:', tierMismatch.length === 0);
  if (tierMismatch.length > 0) throw new Error(`FAIL: riskTier не совпадает с riskTierOf(riskScore) у: ${tierMismatch.map((r) => r.name).join(', ')}`);
  const highRiskBorderRegions = regionConsumptionSeed.filter((r) => r.isBorderRegion && r.riskTier === 'high');
  console.log('приграничных регионов с riskTier=high:', highRiskBorderRegions.length, highRiskBorderRegions.map((r) => r.name));
  if (highRiskBorderRegions.length < 2 || highRiskBorderRegions.length > 3) throw new Error('FAIL: ожидалось 2–3 приграничных региона с высоким риском (Deep Dive, разд. 5)');
  const avgBorderNonres = regionConsumptionSeed.filter((r) => r.isBorderRegion).reduce((s, r) => s + r.nonresidentSharePct, 0) / regionConsumptionSeed.filter((r) => r.isBorderRegion).length;
  const avgInteriorNonres = regionConsumptionSeed.filter((r) => !r.isBorderRegion).reduce((s, r) => s + r.nonresidentSharePct, 0) / regionConsumptionSeed.filter((r) => !r.isBorderRegion).length;
  console.log(`доля нерезидентов: приграничные ${avgBorderNonres.toFixed(1)}% vs внутренние ${avgInteriorNonres.toFixed(1)}%`);
  if (avgBorderNonres <= avgInteriorNonres) throw new Error('FAIL: приграничные регионы должны в среднем иметь более высокую долю нерезидентов');

  console.log('\n=== Очередь кейсов (casesSeed) ===');
  console.log('кейсов:', casesSeed.length);
  if (casesSeed.length < 15 || casesSeed.length > 25) throw new Error('FAIL: ожидалось 15–25 кейсов (Deep Dive, разд. 5)');
  const tierCounts = { high: 0, medium: 0, low: 0 };
  const statusCounts = { new: 0, in_progress: 0, closed: 0 };
  for (const c of casesSeed) {
    tierCounts[c.riskTier]++;
    statusCounts[c.status]++;
    if (c.reasonCodes.length === 0) throw new Error(`FAIL: у кейса ${c.id} нет reason codes`);
    if (riskTierOf(c.riskScore) !== c.riskTier) throw new Error(`FAIL: riskTier не совпадает с riskScore у кейса ${c.id}`);
  }
  console.log('распределение по риск-тирам:', tierCounts);
  if (tierCounts.high === 0 || tierCounts.medium === 0 || tierCounts.low === 0) throw new Error('FAIL: должны присутствовать все 3 риск-тира');
  console.log('распределение по статусам:', statusCounts);
  if (statusCounts.new === 0 || statusCounts.in_progress === 0 || statusCounts.closed === 0) throw new Error('FAIL: должны присутствовать все 3 статуса (не только «новый») — иначе очередь не выглядит живым процессом');
  const idsUnique = new Set(casesSeed.map((c) => c.id)).size === casesSeed.length;
  console.log('id кейсов уникальны:', idsUnique);
  if (!idsUnique) throw new Error('FAIL: id кейсов должны быть уникальны');

  console.log('\n=== Таксономия аномалий (A-06) согласована с очередью кейсов ===');
  console.log(anomalyTaxonomySeed.map((p) => `${p.label}: ${p.currentCount} (было ${p.priorPeriodCount})`));
  if (anomalyTaxonomySeed.length !== 4) throw new Error('FAIL: ожидалось ровно 4 категории таксономии SGS');
  const taxonomySum = anomalyTaxonomySeed.reduce((s, p) => s + p.currentCount, 0);
  console.log('сумма счётчиков категорий === числу кейсов:', taxonomySum === casesSeed.length, `(${taxonomySum} vs ${casesSeed.length})`);
  if (taxonomySum !== casesSeed.length) throw new Error('FAIL: сумма currentCount по категориям должна равняться числу кейсов в очереди');

  console.log('\n=== KPI (A-01) — 6 показателей стратегического слоя ===');
  console.log(kpiSeed.map((k) => `${k.id}: ${k.formattedValue} (${k.deltaPct >= 0 ? '+' : ''}${k.deltaPct}%, ${k.comparisonLabel})`));
  const EXPECTED_KPI_IDS = ['realization', 'legality', 'prevented-export', 'open-high-risk-cases', 'nonresident-share', 'avg-reaction-time'];
  if (kpiSeed.length !== 6) throw new Error('FAIL: ожидалось ровно 6 KPI (Deep Dive, табл. 4.1)');
  const missingKpiIds = EXPECTED_KPI_IDS.filter((id) => !kpiSeed.some((k) => k.id === id));
  if (missingKpiIds.length > 0) throw new Error(`FAIL: отсутствуют обязательные KPI: ${missingKpiIds.join(', ')}`);
  const sparklinesOk = kpiSeed.every((k) => k.sparkline.length === 30);
  console.log('у всех KPI спарклайн из 30 точек:', sparklinesOk);
  if (!sparklinesOk) throw new Error('FAIL: у каждого KPI должен быть спарклайн за 30 дней');
  const legalityKpi = kpiSeed.find((k) => k.id === 'legality')!;
  console.log('у «Индекс легальности» задан valueTone:', legalityKpi.valueTone);
  if (!legalityKpi.valueTone) throw new Error('FAIL: у «Индекс легальности» должна быть цветовая индикация по порогам (≥95/85-95/<85)');
  console.log('«Объём реализации» не круглое число:', !isSuspiciouslyRound(kpiDerived.totalRealizationL), kpiDerived.totalRealizationL);
  if (isSuspiciouslyRound(kpiDerived.totalRealizationL)) throw new Error('FAIL: KPI не должен быть круглым «рекламным» числом (Deep Dive, разд. 5)');
  console.log('«Предотвращённый вывоз» не круглое число:', !isSuspiciouslyRound(kpiDerived.totalPreventedL), kpiDerived.totalPreventedL);
  if (isSuspiciouslyRound(kpiDerived.totalPreventedL)) throw new Error('FAIL: KPI не должен быть круглым «рекламным» числом (Deep Dive, разд. 5)');
  const openCasesKpi = kpiSeed.find((k) => k.id === 'open-high-risk-cases')!;
  const actualOpenHighCount = casesSeed.filter((c) => c.riskTier === 'high' && c.status !== 'closed').length;
  console.log('KPI «Открытые кейсы (High)» совпадает с фактической очередью:', openCasesKpi.formattedValue === String(actualOpenHighCount));
  if (openCasesKpi.formattedValue !== String(actualOpenHighCount)) throw new Error('FAIL: KPI открытых High-кейсов должен совпадать с фактическим количеством в casesSeed');

  console.log('\nВСЕ ПРОВЕРКИ АНАЛИТИЧЕСКИХ ДАННЫХ ПРОЙДЕНЫ УСПЕШНО.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
