/** Полифилл localStorage для проверки zustand persist вне браузера (дымовой скрипт Этапа 1). */
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
  const { useCardStore } = await import('../src/store/card.store');
  const { useAdminStore } = await import('../src/store/admin.store');

  const cardIdToTest = useCardStore.getState().cards[0].id;
  console.log('Карта до заправки:', useCardStore.getState().cards.find((c) => c.id === cardIdToTest));

  useCardStore.getState().consumeLimit(cardIdToTest, 42);
  console.log('Карта после consumeLimit(+42л):', useCardStore.getState().cards.find((c) => c.id === cardIdToTest));

  useAdminStore.getState().login('admin_kmg');

  // Даём persist-middleware время записать в "localStorage" (микротаска записи после set).
  await new Promise((r) => setTimeout(r, 50));

  const rawCard = localStorage.getItem('janarmai-card-store');
  const rawAdmin = localStorage.getItem('janarmai-admin-store');
  console.log('\nlocalStorage["janarmai-card-store"] содержит обновлённый usedTodayL:', rawCard?.includes('"usedTodayL":42'));
  console.log('localStorage["janarmai-admin-store"] содержит текущую сессию:', rawAdmin?.includes('"currentAdminId":"admin_kmg"'));

  useCardStore.getState().reset();
  useAdminStore.getState().reset();
  await new Promise((r) => setTimeout(r, 50));
  console.log('\nПосле resetDemoData — usedTodayL:', useCardStore.getState().cards.find((c) => c.id === cardIdToTest)?.usedTodayL);
  console.log('После resetDemoData — admin session:', useAdminStore.getState().currentAdminId);
}

run();
