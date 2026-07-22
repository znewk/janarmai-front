/** Полифилл localStorage — дымовой скрипт Этапа 5: симуляция заправки (лимит/сверхлимит/80%/безлимитная карта). */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();

async function run() {
  const { simulateFueling } = await import('../src/features/card/fuelingActions');
  const { useCardStore } = await import('../src/store/card.store');
  const { useTransactionStore } = await import('../src/store/transaction.store');

  console.log('=== Заправка в пределах лимита (легковая карта, 100 л, заправка 40 л) ===');
  const flCard = useCardStore.getState().cards.find((c) => c.cardType === 'fl_passenger')!;
  const r1 = simulateFueling({ cardId: flCard.id, fuelType: 'ai92', volumeL: 40 });
  console.log('priceType:', r1.transaction.priceType, '| usedTodayL:', r1.card.usedTodayL, '| remaining:', r1.remainingL, '| warning:', r1.warningThresholdReached);
  if (r1.transaction.priceType !== 'preferential') throw new Error('FAIL: заправка в пределах лимита должна быть по льготной цене');
  if (r1.card.usedTodayL !== 40 || r1.remainingL !== 60) throw new Error('FAIL: неверный расчёт остатка после первой заправки');

  console.log('\n=== Вторая заправка приближает к 80% (ещё 45 л => 85/100) ===');
  const r2 = simulateFueling({ cardId: flCard.id, fuelType: 'ai92', volumeL: 45 });
  console.log('priceType:', r2.transaction.priceType, '| usedTodayL:', r2.card.usedTodayL, '| remaining:', r2.remainingL, '| warning:', r2.warningThresholdReached);
  if (!r2.warningThresholdReached) throw new Error('FAIL: должен сработать порог 80% (85/100 использовано)');
  if (r2.transaction.priceType !== 'preferential') throw new Error('FAIL: 45л ещё укладывается в остаток 60л — должна быть льготная цена');

  console.log('\n=== Третья заправка превышает лимит (ещё 30 л => 115/100, сверх остатка 15л) ===');
  const r3 = simulateFueling({ cardId: flCard.id, fuelType: 'ai92', volumeL: 30 });
  console.log('priceType:', r3.transaction.priceType, '| usedTodayL:', r3.card.usedTodayL, '| remaining:', r3.remainingL);
  if (r3.transaction.priceType !== 'market') throw new Error('FAIL: заправка сверх остатка лимита должна быть по предельной цене');
  if (r3.card.usedTodayL !== 115 || r3.remainingL !== 0) throw new Error('FAIL: usedTodayL должен расти на весь фактический объём, остаток не может быть отрицательным');

  console.log('\n=== Заправка карты без лимита (иностранец) — всегда по предельной цене ===');
  const foreignCard = useCardStore.getState().cards.find((c) => c.cardType === 'fl_person')!;
  const r4 = simulateFueling({ cardId: foreignCard.id, fuelType: 'dt', volumeL: 200 });
  console.log('priceType:', r4.transaction.priceType, '| usedTodayL:', r4.card.usedTodayL, '| remaining:', r4.remainingL);
  if (r4.transaction.priceType !== 'market' || r4.remainingL !== null) throw new Error('FAIL: карта без лимита всегда по предельной цене, remaining=null');

  const txnCountBefore = 11; // seed
  const txnCountAfter = useTransactionStore.getState().transactions.length;
  console.log('\nТранзакций в истории:', txnCountAfter, `(seed ${txnCountBefore} + 4 новых)`);
  if (txnCountAfter !== txnCountBefore + 4) throw new Error('FAIL: не все транзакции сохранены в историю');

  console.log('\nВСЕ СЦЕНАРИИ СИМУЛЯЦИИ ЗАПРАВКИ ПРОЙДЕНЫ УСПЕШНО.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
