import { saveAs } from 'file-saver';
import type { Card, Transaction, Vehicle, Driver } from '@/types/entities';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

const CATEGORY_LABEL: Record<Vehicle['category'], string> = { passenger: 'легковая', truck: 'грузовая' };

/** S-27 — экспорт отчёта по автопарку (мок CSV, тех.план раздел 1 «Экспорт отчёта (мок)»). */
export function exportFleetReportCsv(params: { companyName: string; transactions: Transaction[]; cards: Card[]; vehicles: Vehicle[]; drivers: Driver[] }) {
  const header = ['Дата/время', 'ГРНЗ', 'Категория', 'Водитель', 'АЗС', 'Топливо', 'Литры', 'Тип цены', 'Цена/л, тг', 'Сумма, тг'];

  const rows = params.transactions.map((t) => {
    const card = params.cards.find((c) => c.id === t.cardId);
    const vehicle = card?.vehicleId ? params.vehicles.find((v) => v.id === card.vehicleId) : undefined;
    const driver = vehicle?.driverId ? params.drivers.find((d) => d.id === vehicle.driverId) : undefined;
    return [
      new Date(t.dateTime).toLocaleString('ru-RU'),
      vehicle?.grnz ?? '',
      vehicle ? CATEGORY_LABEL[vehicle.category] : '',
      driver?.fio ?? '',
      t.stationName,
      FUEL_TYPE_LABEL[t.fuelType],
      String(t.volumeL),
      t.priceType === 'preferential' ? 'льготная' : 'предельная',
      String(t.pricePerLiterKzt),
      String(t.totalKzt),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const fileName = `janarmai-report-${params.companyName.replace(/[^\p{L}\p{N}]+/gu, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;
  saveAs(blob, fileName);
}
