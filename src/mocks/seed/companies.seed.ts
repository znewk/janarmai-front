import type { Company } from '@/types/entities';

export const companiesSeed: Company[] = [
  {
    id: 'company_resident',
    residency: 'resident',
    name: 'ТОО «Жолжелдер Логистикс»',
    bin: '123456789012',
    directorId: 'user_director_resident',
    phone: '+77272345601',
    channel: 'kmg',
    createdAt: '2026-06-06T05:00:00.000Z',
  },
  {
    id: 'company_nonresident',
    residency: 'nonresident',
    name: 'ООО «ТрансЛогистик РУ»',
    registrationNumber: 'RU-7743012345',
    directorId: 'user_director_foreign',
    phone: '+74951234567',
    channel: 'kmg',
    createdAt: '2026-06-07T05:00:00.000Z',
  },
];
