import type { Vehicle } from '@/types/entities';

export const vehiclesSeed: Vehicle[] = [
  // ФЛ-резидент (eGov) — легковая, личная карта (100 л/чел.)
  { id: 'veh_fl_egov_1', ownerKind: 'user', ownerId: 'user_fl_egov', grnz: '001AAA02', category: 'passenger', active: true },

  // ФЛ-резидент (КМГ) — легковая + грузовая → 2 карты
  { id: 'veh_fl_kmg_1', ownerKind: 'user', ownerId: 'user_fl_kmg', grnz: '002BBB02', category: 'passenger', active: true },
  { id: 'veh_fl_kmg_2', ownerKind: 'user', ownerId: 'user_fl_kmg', grnz: '450CCC02', category: 'truck', active: true },

  // ЮЛ-резидент — автопарк из 3 ТС
  {
    id: 'veh_company_res_1',
    ownerKind: 'company',
    ownerId: 'company_resident',
    grnz: '777DDD01',
    category: 'passenger',
    driverId: 'driver_res_1',
    active: true,
  },
  {
    id: 'veh_company_res_2',
    ownerKind: 'company',
    ownerId: 'company_resident',
    grnz: '778EEE01',
    category: 'truck',
    driverId: 'driver_res_2',
    active: true,
  },
  { id: 'veh_company_res_3', ownerKind: 'company', ownerId: 'company_resident', grnz: '779FFF01', category: 'truck', active: true },

  // ЮЛ-нерезидент — автопарк из 2 ТС, без льготной цены
  {
    id: 'veh_company_nonres_1',
    ownerKind: 'company',
    ownerId: 'company_nonresident',
    grnz: 'A777KM77',
    category: 'truck',
    driverId: 'driver_nonres_1',
    active: true,
  },
  { id: 'veh_company_nonres_2', ownerKind: 'company', ownerId: 'company_nonresident', grnz: 'A778KM77', category: 'truck', active: true },
];
