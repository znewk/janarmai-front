import type { Driver } from '@/types/entities';

/** Водители автопарка ЮЛ — используются только для истории «кто заправлял», не влияют на лимит (5.2, 4.4). */
export const driversSeed: Driver[] = [
  { id: 'driver_res_1', companyId: 'company_resident', iin: '911212300111', fio: 'Сериков Данияр Ануарович', active: true },
  { id: 'driver_res_2', companyId: 'company_resident', iin: '880303400222', fio: 'Қасымов Ерлан Тохтарович', active: true },
  { id: 'driver_nonres_1', companyId: 'company_nonresident', iin: '', fio: 'Volkov Denis Igorevich', active: true },
];
