/** Полифилл localStorage — дымовой скрипт Этапа 6: кабинет ФЛ/ЮЛ, управление автопарком, экспорт отчёта. */
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
  const { selectSessionCards } = await import('../src/lib/sessionCards');
  const { addFleetVehicle, deactivateVehicle, assignDriver, unassignDriver } = await import('../src/features/cabinet-ul/fleetActions');

  console.log('=== Кабинет ФЛ: подбор карт сессии ===');
  useUserStore.getState().login('user_fl_kmg');
  const flCards = selectSessionCards({
    cards: useCardStore.getState().cards,
    vehicles: useUserStore.getState().vehicles,
    currentUserId: useUserStore.getState().currentUserId,
    currentCompanyId: useUserStore.getState().currentCompanyId,
  });
  console.log('карт у user_fl_kmg:', flCards.length, flCards.map((c) => c.cardType));
  if (flCards.length !== 2) throw new Error('FAIL: у user_fl_kmg должно быть 2 карты (легковая+грузовая)');
  useUserStore.getState().logout();

  console.log('\n=== Кабинет ЮЛ: подбор карт сессии ===');
  useUserStore.getState().login('user_director_resident', 'company_resident');
  const ulCardsBefore = selectSessionCards({
    cards: useCardStore.getState().cards,
    vehicles: useUserStore.getState().vehicles,
    currentUserId: useUserStore.getState().currentUserId,
    currentCompanyId: useUserStore.getState().currentCompanyId,
  });
  console.log('карт автопарка company_resident (до):', ulCardsBefore.length);
  if (ulCardsBefore.length !== 3) throw new Error('FAIL: у company_resident изначально 3 ТС/карты');

  console.log('\n=== S-26: добавление ТС в автопарк ===');
  const { vehicleId, card } = addFleetVehicle({
    companyId: 'company_resident',
    residency: 'resident',
    companyIdentifier: '123456789012',
    grnz: '999ZZZ01',
    category: 'passenger',
  });
  console.log('добавлено ТС', vehicleId, '-> карта', card.cardType, card.dailyLimitL, 'л');
  if (card.dailyLimitL !== 100 || card.cardType !== 'ul_passenger') throw new Error('FAIL: неверная карта для нового легкового ТС резидента');

  const ulCardsAfterAdd = selectSessionCards({
    cards: useCardStore.getState().cards,
    vehicles: useUserStore.getState().vehicles,
    currentUserId: useUserStore.getState().currentUserId,
    currentCompanyId: useUserStore.getState().currentCompanyId,
  });
  console.log('карт автопарка (после добавления):', ulCardsAfterAdd.length);
  if (ulCardsAfterAdd.length !== 4) throw new Error('FAIL: после добавления должно быть 4 карты');

  console.log('\n=== S-26: назначение и снятие водителя ===');
  const { driverId } = assignDriver({ companyId: 'company_resident', vehicleId, fio: 'Новый Водитель', iin: '900101300100' });
  const vehicleAfterAssign = useUserStore.getState().vehicles.find((v) => v.id === vehicleId)!;
  console.log('водитель назначен:', vehicleAfterAssign.driverId === driverId);
  if (vehicleAfterAssign.driverId !== driverId) throw new Error('FAIL: водитель не назначен');
  unassignDriver(vehicleId, driverId);
  const vehicleAfterUnassign = useUserStore.getState().vehicles.find((v) => v.id === vehicleId)!;
  const driverAfterUnassign = useUserStore.getState().drivers.find((d) => d.id === driverId)!;
  console.log('водитель снят:', vehicleAfterUnassign.driverId === undefined, '| водитель деактивирован:', !driverAfterUnassign.active);
  if (vehicleAfterUnassign.driverId !== undefined || driverAfterUnassign.active) throw new Error('FAIL: снятие водителя не сработало корректно');

  console.log('\n=== S-26: деактивация ТС ===');
  deactivateVehicle(vehicleId, card.id);
  const ulCardsAfterDeactivate = selectSessionCards({
    cards: useCardStore.getState().cards,
    vehicles: useUserStore.getState().vehicles,
    currentUserId: useUserStore.getState().currentUserId,
    currentCompanyId: useUserStore.getState().currentCompanyId,
  });
  console.log('карт автопарка (после деактивации):', ulCardsAfterDeactivate.length);
  if (ulCardsAfterDeactivate.length !== 3) throw new Error('FAIL: деактивированное ТС не должно учитываться в сессии');

  console.log('\nВСЕ ПРОВЕРКИ КАБИНЕТА ФЛ/ЮЛ ПРОЙДЕНЫ УСПЕШНО.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
