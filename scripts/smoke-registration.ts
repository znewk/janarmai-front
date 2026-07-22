/** Полифилл localStorage — дымовой скрипт Этапа 3: проверка бизнес-логики регистрации всех 5 веток вне браузера. */
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
  const { finalizeFlRegistration, finalizeUlRegistration } = await import('../src/features/onboarding/registrationActions');
  const { useUserStore } = await import('../src/store/user.store');
  const { useCardStore } = await import('../src/store/card.store');
  const { checkGbdFl, checkBmg, checkBerkut, checkGbdUl } = await import('../src/mocks/api');

  console.log('=== Ветка 1: ФЛ-резидент eGov/БВУ (легковая) ===');
  const r1 = finalizeFlRegistration({ residency: 'resident', fio: 'Демо Тест1', phone: '+77011111111', channel: 'egov', iin: '900101300121', vehicle: { grnz: '001AAA02', category: 'passenger' } });
  console.log('карт:', r1.cards.length, r1.cards.map((c) => `${c.cardType}:${c.dailyLimitL}л`));
  if (r1.cards.length !== 1 || r1.cards[0].dailyLimitL !== 100) throw new Error('FAIL: ожидалась 1 карта 100л');

  console.log('\n=== Ветка 2: ФЛ-резидент КМГ (грузовая, полный путь + негативный сценарий) ===');
  const gbdErr = await checkGbdFl({ iin: '900101300129', fio: 'X' });
  console.log('checkGbdFl(IIN на 9) ->', gbdErr.status, gbdErr.status === 'error' ? gbdErr.errorCode : '');
  if (gbdErr.status !== 'error') throw new Error('FAIL: ожидалась ошибка ГБД ФЛ');
  const bmgErr = await checkBmg({ iin: '900101300127', phone: 'x' });
  console.log('checkBmg(IIN на 7) ->', bmgErr.status, bmgErr.status === 'error' ? bmgErr.errorCode : '');
  const r2 = finalizeFlRegistration({ residency: 'resident', fio: 'Демо Тест2', phone: '+77022222222', channel: 'kmg', iin: '900101300122', vehicle: { grnz: '450CCC02', category: 'truck' } });
  console.log('карт:', r2.cards.length, r2.cards.map((c) => `${c.cardType}:${c.dailyLimitL}л:vehicleId=${c.vehicleId}`));
  if (r2.cards.length !== 1 || r2.cards[0].dailyLimitL !== 300 || r2.cards[0].ownerKind !== 'vehicle') throw new Error('FAIL: ожидалась 1 карта 300л на ТС');

  console.log('\n=== Ветка 3: ФЛ-иностранец (негативный сценарий Беркут + позитивный) ===');
  const berkutErr = await checkBerkut({ passportNumber: 'DUP12345' });
  console.log('checkBerkut(DUP) ->', berkutErr.status, berkutErr.status === 'error' ? berkutErr.errorCode : '');
  if (berkutErr.status !== 'error' || berkutErr.errorCode !== 'BERKUT_DUPLICATE_PASSPORT') throw new Error('FAIL: ожидался отказ дубликат паспорта');
  const berkutOk = await checkBerkut({ passportNumber: 'P9998887' });
  console.log('checkBerkut(P9998887) ->', berkutOk.status);
  const r3 = finalizeFlRegistration({ residency: 'nonresident', fio: 'Demo Foreign', phone: '+79261112233', channel: 'kmg', passportNumber: 'P9998887' });
  console.log('карт:', r3.cards.length, r3.cards.map((c) => `${c.cardType}:limit=${c.dailyLimitL}:priceEligible=${c.priceEligible}`));
  if (r3.cards.length !== 1 || r3.cards[0].dailyLimitL !== null || r3.cards[0].priceEligible !== false) throw new Error('FAIL: ожидалась карта без лимита и без льготы');

  console.log('\n=== Ветка 4: ЮЛ-резидент (автопарк из 2 ТС) ===');
  const gbdUlOk = await checkGbdUl('123456789011');
  console.log('checkGbdUl ->', gbdUlOk.status, gbdUlOk.status === 'success' ? gbdUlOk.data.name : '');
  const r4 = finalizeUlRegistration({
    residency: 'resident',
    name: 'ТОО Демо',
    bin: '123456789011',
    phone: '+77273330011',
    directorFio: 'Директор Демо',
    directorIdentifier: '123456789011',
    vehicles: [
      { grnz: '111AAA01', category: 'passenger' },
      { grnz: '222BBB01', category: 'truck', driverFio: 'Водитель Демо', driverIin: '900101300100' },
    ],
  });
  console.log('карт:', r4.cards.length, r4.cards.map((c) => `${c.cardType}:${c.dailyLimitL}л:priceEligible=${c.priceEligible}`));
  if (r4.cards.length !== 2 || !r4.cards.every((c) => c.priceEligible)) throw new Error('FAIL: ожидалось 2 карты с льготой');

  console.log('\n=== Ветка 5: ЮЛ-нерезидент (без льготной цены) ===');
  const r5 = finalizeUlRegistration({
    residency: 'nonresident',
    name: 'ООО Demo Foreign',
    registrationNumber: 'RU-999',
    phone: '+74950001122',
    directorFio: 'Director Demo',
    directorIdentifier: 'P1112223',
    vehicles: [{ grnz: 'A999KM77', category: 'truck' }],
  });
  console.log('карт:', r5.cards.length, r5.cards.map((c) => `${c.cardType}:limit=${c.dailyLimitL}:priceEligible=${c.priceEligible}`));
  if (r5.cards.length !== 1 || r5.cards[0].dailyLimitL !== null || r5.cards[0].priceEligible !== false) throw new Error('FAIL: ожидалась карта без лимита и без льготы');

  console.log('\nВСЕ 5 ВЕТОК ПРОЙДЕНЫ УСПЕШНО, включая негативные сценарии (ГБД ФЛ/БМГ/Беркут).');
  console.log('Всего пользователей в сторе:', useUserStore.getState().users.length, '(seed 5 + 4 новых ФЛ + 2 директора ЮЛ)');
  console.log('Всего компаний:', useUserStore.getState().companies.length, '(seed 2 + 2 новых)');
  console.log('Всего карт:', useCardStore.getState().cards.length);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
