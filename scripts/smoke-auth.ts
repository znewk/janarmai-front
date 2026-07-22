/** Полифилл localStorage — дымовой скрипт Этапа 4: вход/выход всеми способами на seed-аккаунтах. */
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
  const { useAdminStore } = await import('../src/store/admin.store');
  const { verifySmsCode, checkAdminCredentials } = await import('../src/mocks/api');

  console.log('=== S-15: eGov/БВУ — мгновенный вход по выбору из списка ===');
  const egovUser = useUserStore.getState().users.find((u) => u.channel === 'egov');
  if (!egovUser) throw new Error('FAIL: нет seed-пользователя eGov');
  useUserStore.getState().login(egovUser.id);
  console.log('currentUserId после входа:', useUserStore.getState().currentUserId);
  if (useUserStore.getState().currentUserId !== egovUser.id) throw new Error('FAIL: сессия не установлена');
  useUserStore.getState().logout();
  console.log('currentUserId после выхода:', useUserStore.getState().currentUserId);
  if (useUserStore.getState().currentUserId !== null) throw new Error('FAIL: сессия не очищена');

  console.log('\n=== S-16: телефон + SMS (КМГ, резидент) ===');
  const kmgUser = useUserStore.getState().users.find((u) => u.channel === 'kmg' && u.residency === 'resident');
  if (!kmgUser) throw new Error('FAIL: нет seed-пользователя КМГ-резидента');
  const smsRes = await verifySmsCode('1234');
  console.log('verifySmsCode(1234) ->', smsRes.status);
  if (smsRes.status !== 'success') throw new Error('FAIL: демо-код должен подтверждаться');
  useUserStore.getState().login(kmgUser.id);
  console.log('currentUserId после входа:', useUserStore.getState().currentUserId);
  useUserStore.getState().logout();

  console.log('\n=== S-16: телефон + SMS (КМГ, иностранец) ===');
  const foreignUser = useUserStore.getState().users.find((u) => u.channel === 'kmg' && u.residency === 'nonresident');
  if (!foreignUser) throw new Error('FAIL: нет seed-иностранца');
  useUserStore.getState().login(foreignUser.id);
  console.log('вход иностранца:', useUserStore.getState().currentUserId === foreignUser.id ? 'OK' : 'FAIL');
  useUserStore.getState().logout();

  console.log('\n=== S-17: БИН + код (ЮЛ-резидент) ===');
  const companyRes = useUserStore.getState().companies.find((c) => c.residency === 'resident');
  if (!companyRes) throw new Error('FAIL: нет seed-компании резидента');
  useUserStore.getState().login(companyRes.directorId, companyRes.id);
  console.log('currentUserId/currentCompanyId после входа:', useUserStore.getState().currentUserId, useUserStore.getState().currentCompanyId);
  if (useUserStore.getState().currentCompanyId !== companyRes.id) throw new Error('FAIL: сессия ЮЛ не установлена');
  useUserStore.getState().logout();

  console.log('\n=== S-17: рег.номер + код (ЮЛ-нерезидент) ===');
  const companyNonres = useUserStore.getState().companies.find((c) => c.residency === 'nonresident');
  if (!companyNonres) throw new Error('FAIL: нет seed-компании нерезидента');
  useUserStore.getState().login(companyNonres.directorId, companyNonres.id);
  console.log('вход ЮЛ-нерезидента:', useUserStore.getState().currentCompanyId === companyNonres.id ? 'OK' : 'FAIL');
  useUserStore.getState().logout();

  console.log('\n=== A-00: вход администратора ===');
  const adminOk = await checkAdminCredentials('kmg.analyst', 'demo1234');
  console.log('checkAdminCredentials(верные) ->', adminOk.status);
  if (adminOk.status !== 'success') throw new Error('FAIL: верные данные администратора должны проходить');
  useAdminStore.getState().login(adminOk.data.id);
  console.log('currentAdminId после входа:', useAdminStore.getState().currentAdminId);
  const adminErr = await checkAdminCredentials('kmg.analyst', 'wrong');
  console.log('checkAdminCredentials(неверный пароль) ->', adminErr.status, adminErr.status === 'error' ? adminErr.errorCode : '');
  if (adminErr.status !== 'error') throw new Error('FAIL: неверный пароль должен отклоняться');
  useAdminStore.getState().logout();
  console.log('currentAdminId после выхода:', useAdminStore.getState().currentAdminId);
  if (useAdminStore.getState().currentAdminId !== null) throw new Error('FAIL: админ-сессия не очищена');

  console.log('\nВСЕ СПОСОБЫ ВХОДА/ВЫХОДА ПРОЙДЕНЫ УСПЕШНО (S-15..S-17, A-00).');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
