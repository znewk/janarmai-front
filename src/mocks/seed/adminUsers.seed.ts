import type { AdminUser } from '@/types/entities';

/** Служебные аккаунты аналитического модуля — выданы заранее, регистрации внутри демо нет (ТЗ 4.7). */
export const adminUsersSeed: AdminUser[] = [
  { id: 'admin_kmg', login: 'kmg.analyst', password: 'demo1234', fio: 'Нурланов Тимур Есенович', role: 'kmg' },
  { id: 'admin_minenergo', login: 'minenergo.analyst', password: 'demo1234', fio: 'Сатпаева Айгерим Болатовна', role: 'minenergo' },
  { id: 'admin_akimat', login: 'akimat.analyst', password: 'demo1234', fio: 'Жумабеков Олжас Канатович', role: 'akimat' },
];
