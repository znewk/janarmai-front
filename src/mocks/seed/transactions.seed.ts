import type { Transaction } from '@/types/entities';
import { PRICE_KZT } from './limits.seed';

function tx(partial: Pick<Transaction, 'id' | 'cardId' | 'dateTime' | 'fuelType' | 'volumeL' | 'stationId' | 'stationName' | 'priceType'>): Transaction {
  const pricePerLiterKzt = PRICE_KZT[partial.priceType][partial.fuelType];
  return { ...partial, pricePerLiterKzt, totalKzt: Math.round(pricePerLiterKzt * partial.volumeL) };
}

/** История заправок демо-аккаунтов за последние дни — для проверки кабинетов ФЛ/ЮЛ (Этап 6) без запуска симуляции. */
export const transactionsSeed: Transaction[] = [
  tx({ id: 'txn_01', cardId: 'card_user_fl_egov', dateTime: '2026-07-20T03:15:00.000Z', fuelType: 'ai92', volumeL: 40, stationId: 'st_07', stationName: 'КМГ АЗС №02', priceType: 'preferential' }),
  tx({ id: 'txn_02', cardId: 'card_user_fl_egov', dateTime: '2026-07-21T09:40:00.000Z', fuelType: 'ai95', volumeL: 35, stationId: 'st_08', stationName: 'Гелиос №1', priceType: 'preferential' }),
  tx({ id: 'txn_03', cardId: 'card_user_fl_kmg', dateTime: '2026-07-19T06:05:00.000Z', fuelType: 'ai92', volumeL: 45, stationId: 'st_07', stationName: 'КМГ АЗС №02', priceType: 'preferential' }),
  tx({ id: 'txn_04', cardId: 'card_user_fl_kmg_veh_fl_kmg_2', dateTime: '2026-07-21T04:20:00.000Z', fuelType: 'dt', volumeL: 180, stationId: 'st_10', stationName: 'КМГ АЗС №45', priceType: 'preferential' }),
  tx({ id: 'txn_05', cardId: 'card_user_fl_foreign', dateTime: '2026-07-20T11:00:00.000Z', fuelType: 'ai95', volumeL: 30, stationId: 'st_01', stationName: 'КМГ АЗС №14', priceType: 'market' }),
  tx({ id: 'txn_06', cardId: 'card_user_fl_foreign', dateTime: '2026-07-21T12:30:00.000Z', fuelType: 'ai95', volumeL: 28, stationId: 'st_05', stationName: 'КМГ АЗС №31', priceType: 'market' }),
  tx({ id: 'txn_07', cardId: 'card_veh_company_res_1', dateTime: '2026-07-19T05:10:00.000Z', fuelType: 'ai92', volumeL: 50, stationId: 'st_10', stationName: 'КМГ АЗС №45', priceType: 'preferential' }),
  tx({ id: 'txn_08', cardId: 'card_veh_company_res_2', dateTime: '2026-07-20T07:45:00.000Z', fuelType: 'dt', volumeL: 210, stationId: 'st_10', stationName: 'КМГ АЗС №45', priceType: 'preferential' }),
  tx({ id: 'txn_09', cardId: 'card_veh_company_res_3', dateTime: '2026-07-21T08:00:00.000Z', fuelType: 'dt', volumeL: 250, stationId: 'st_14', stationName: 'КМГ АЗС №17', priceType: 'preferential' }),
  tx({ id: 'txn_10', cardId: 'card_veh_company_nonres_1', dateTime: '2026-07-20T13:15:00.000Z', fuelType: 'dt', volumeL: 300, stationId: 'st_02', stationName: 'КМГ АЗС №22', priceType: 'market' }),
  tx({ id: 'txn_11', cardId: 'card_veh_company_nonres_2', dateTime: '2026-07-21T14:50:00.000Z', fuelType: 'dt', volumeL: 260, stationId: 'st_02', stationName: 'КМГ АЗС №22', priceType: 'market' }),
];
