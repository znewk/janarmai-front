import type { User } from '@/types/entities';

/**
 * Стартовые пользователи демо-сессии — по одному на каждую ветку регистрации/входа (раздел 4 ТЗ),
 * чтобы вход в уже созданный аккаунт (Этап 4) был проверяем без прохождения регистрации заново.
 * ИИН/номера паспортов подобраны так, чтобы НЕ попадать под коды ошибок мок-проверок (см. OPEN_QUESTIONS.md).
 */
export const usersSeed: User[] = [
  {
    id: 'user_fl_egov',
    type: 'fl',
    residency: 'resident',
    fio: 'Асанов Ануар Бахытович',
    phone: '+77011234501',
    channel: 'egov',
    iin: '900101300123',
    createdAt: '2026-06-01T05:00:00.000Z',
  },
  {
    id: 'user_fl_kmg',
    type: 'fl',
    residency: 'resident',
    fio: 'Ахметова Гульнара Сериковна',
    phone: '+77011234502',
    channel: 'kmg',
    iin: '850515350456',
    createdAt: '2026-06-02T05:00:00.000Z',
  },
  {
    id: 'user_fl_foreign',
    type: 'fl',
    residency: 'nonresident',
    fio: 'Smirnov Ivan Petrovich',
    phone: '+79261234567',
    channel: 'kmg',
    passportNumber: 'P1234567',
    createdAt: '2026-06-03T05:00:00.000Z',
  },
  {
    id: 'user_director_resident',
    type: 'fl',
    residency: 'resident',
    fio: 'Тлеубердиев Мурат Серикович',
    phone: '+77011234503',
    channel: 'kmg',
    iin: '780203400789',
    createdAt: '2026-06-04T05:00:00.000Z',
  },
  {
    id: 'user_director_foreign',
    type: 'fl',
    residency: 'nonresident',
    fio: 'Petrov Sergey Alexandrovich',
    phone: '+79161234321',
    channel: 'kmg',
    passportNumber: 'P7654321',
    createdAt: '2026-06-05T05:00:00.000Z',
  },
];
