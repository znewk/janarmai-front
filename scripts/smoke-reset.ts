/** Дымовой скрипт Этапа 8: «Сбросить демо-данные» после мутаций во всех 4 сторах возвращает чистое стартовое состояние. */
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
  const { useUserStore } = await import('../src/store/user.store');
  const { useCardStore } = await import('../src/store/card.store');
  const { useTransactionStore } = await import('../src/store/transaction.store');
  const { useAdminStore } = await import('../src/store/admin.store');
  const { resetDemoData } = await import('../src/store/resetDemoData');
  const { finalizeFlRegistration } = await import('../src/features/onboarding/registrationActions');
  const { simulateFueling } = await import('../src/features/card/fuelingActions');

  const seedCounts = {
    users: useUserStore.getState().users.length,
    companies: useUserStore.getState().companies.length,
    vehicles: useUserStore.getState().vehicles.length,
    drivers: useUserStore.getState().drivers.length,
    cards: useCardStore.getState().cards.length,
    transactions: useTransactionStore.getState().transactions.length,
  };
  console.log('Seed-состояние:', seedCounts);

  console.log('\n=== Мутации во всех сторах (регистрация + заправка + сессии) ===');
  const { userId } = finalizeFlRegistration({ residency: 'resident', fio: 'Сброс Тест', phone: '+77099999999', channel: 'kmg', iin: '900101300123' });
  useUserStore.getState().login(userId);
  const anyCard = useCardStore.getState().cards[0];
  simulateFueling({ cardId: anyCard.id, fuelType: 'ai92', volumeL: 10 });
  useAdminStore.getState().login('admin_kmg');

  const mutatedCounts = {
    users: useUserStore.getState().users.length,
    cards: useCardStore.getState().cards.length,
    transactions: useTransactionStore.getState().transactions.length,
    currentUserId: useUserStore.getState().currentUserId,
    currentAdminId: useAdminStore.getState().currentAdminId,
  };
  console.log('После мутаций:', mutatedCounts);
  if (mutatedCounts.users === seedCounts.users) throw new Error('FAIL: мутация должна была добавить пользователя');
  if (mutatedCounts.currentUserId === null || mutatedCounts.currentAdminId === null) throw new Error('FAIL: сессии должны быть установлены');

  console.log('\n=== Сбросить демо-данные ===');
  resetDemoData();

  const afterReset = {
    users: useUserStore.getState().users.length,
    companies: useUserStore.getState().companies.length,
    vehicles: useUserStore.getState().vehicles.length,
    drivers: useUserStore.getState().drivers.length,
    cards: useCardStore.getState().cards.length,
    transactions: useTransactionStore.getState().transactions.length,
    currentUserId: useUserStore.getState().currentUserId,
    currentCompanyId: useUserStore.getState().currentCompanyId,
    currentAdminId: useAdminStore.getState().currentAdminId,
  };
  console.log('После сброса:', afterReset);

  if (afterReset.users !== seedCounts.users) throw new Error('FAIL: users не вернулись к seed');
  if (afterReset.companies !== seedCounts.companies) throw new Error('FAIL: companies не вернулись к seed');
  if (afterReset.vehicles !== seedCounts.vehicles) throw new Error('FAIL: vehicles не вернулись к seed');
  if (afterReset.drivers !== seedCounts.drivers) throw new Error('FAIL: drivers не вернулись к seed');
  if (afterReset.cards !== seedCounts.cards) throw new Error('FAIL: cards не вернулись к seed');
  if (afterReset.transactions !== seedCounts.transactions) throw new Error('FAIL: transactions не вернулись к seed');
  if (afterReset.currentUserId !== null || afterReset.currentCompanyId !== null) throw new Error('FAIL: пользовательская сессия не очищена');
  if (afterReset.currentAdminId !== null) throw new Error('FAIL: админ-сессия не очищена');

  console.log('\nСБРОС ДЕМО-ДАННЫХ КОРРЕКТНО ВОЗВРАЩАЕТ ЧИСТОЕ СТАРТОВОЕ СОСТОЯНИЕ ВО ВСЕХ 4 СТОРАХ.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
