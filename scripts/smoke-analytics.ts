/** Дымовой скрипт Этапа 7: сверка seed-данных аналитики между собой и с GeoJSON областей РК. */
import kzGeo from '../src/mocks/geo/kz-oblasts.json';

async function run() {
  const { regionConsumptionSeed, monthlyLegalitySeed, consumptionStructureSeed, stationNetworkStatsSeed, controlRulesSeed, kpiSeed, fuelTourismSeed } =
    await import('../src/mocks/seed/analytics.seed');

  console.log('=== Проверка соответствия названий регионов GeoJSON <-> seed ===');
  const geoNames = new Set((kzGeo as { features: { properties: { name: string } }[] }).features.map((f) => f.properties.name));
  const seedNames = regionConsumptionSeed.map((r) => r.name);
  const missingInGeo = seedNames.filter((n) => !geoNames.has(n));
  const missingInSeed = Array.from(geoNames).filter((n) => !seedNames.includes(n));
  console.log('регионов в GeoJSON:', geoNames.size, '| регионов в seed:', seedNames.length);
  console.log('в seed, но нет в GeoJSON:', missingInGeo);
  console.log('в GeoJSON, но нет в seed:', missingInSeed);
  if (missingInGeo.length > 0 || missingInSeed.length > 0) throw new Error('FAIL: названия регионов не совпадают — тепловая карта не подсветит эти области');

  console.log('\n=== Проверка сезонности СНТ vs Продажи ===');
  console.log('месяцев:', monthlyLegalitySeed.length);
  if (monthlyLegalitySeed.length !== 12) throw new Error('FAIL: ожидалось 12 месяцев');
  const salesNeverExceedSnt = monthlyLegalitySeed.every((m) => m.salesVolumeMlnL <= m.sntVolumeMlnL);
  console.log('продажи никогда не превышают закуп:', salesNeverExceedSnt);
  if (!salesNeverExceedSnt) throw new Error('FAIL: продажи не могут превышать физический закуп по СНТ');
  const legalityGrows = monthlyLegalitySeed[11].legalityIndexPct > monthlyLegalitySeed[0].legalityIndexPct;
  console.log('индекс легальности растёт к концу периода:', legalityGrows, `(${monthlyLegalitySeed[0].legalityIndexPct}% -> ${monthlyLegalitySeed[11].legalityIndexPct}%)`);
  if (!legalityGrows) throw new Error('FAIL: ожидался рост индекса легальности');

  console.log('\n=== Проверка структуры потребления ===');
  const structureSumsTo100 = consumptionStructureSeed.every((p) => Math.abs(p.residentSharePct + p.nonresidentSharePct - 100) < 0.01);
  console.log('доли резидентов+нерезидентов = 100% в каждом месяце:', structureSumsTo100);
  if (!structureSumsTo100) throw new Error('FAIL: доли должны суммироваться в 100%');

  console.log('\n=== Проверка рейтинга сетей АЗС ===');
  console.log('сетей:', stationNetworkStatsSeed.length, stationNetworkStatsSeed.map((s) => `${s.network}: auth=${s.janarmaiAuthorizations} ofd=${s.ofdReceipts}`));
  const helios = stationNetworkStatsSeed.find((s) => s.network === 'Гелиос')!;
  console.log('«Гелиос» показывает аномалию (ofd > auth):', helios.ofdReceipts > helios.janarmaiAuthorizations);
  if (helios.ofdReceipts <= helios.janarmaiAuthorizations) throw new Error('FAIL: ожидалась демонстрационная аномалия у «Гелиос»');

  console.log('\n=== Проверка индекса топливного туризма ===');
  console.log(fuelTourismSeed);
  if (fuelTourismSeed[0].nonresidentSharePct <= fuelTourismSeed[1].nonresidentSharePct) throw new Error('FAIL: в приграничных регионах доля нерезидентов должна быть выше');

  console.log('\n=== Проверка блока интеллектуального контроля ===');
  console.log('правил:', controlRulesSeed.length, '| легально:', controlRulesSeed.filter((r) => r.status === 'ok').length, '| блокировка:', controlRulesSeed.filter((r) => r.status === 'blocked').length);
  if (!controlRulesSeed.some((r) => r.status === 'ok') || !controlRulesSeed.some((r) => r.status === 'blocked')) throw new Error('FAIL: должны быть оба статуса');

  console.log('\n=== KPI ===');
  console.log(kpiSeed);

  console.log('\nВСЕ ПРОВЕРКИ АНАЛИТИЧЕСКИХ ДАННЫХ ПРОЙДЕНЫ УСПЕШНО.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
