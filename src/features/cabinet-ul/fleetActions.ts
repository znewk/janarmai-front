import type { Residency, VehicleCategory } from '@/types/entities';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { deriveUlCardSpec, materializeCard } from '@/lib/cardRules';
import { maskIdentifier } from '@/lib/mask';
import { generateId } from '@/lib/id';

/** S-26 — управление автопарком: добавление ТС (с автоматическим выпуском карты) и деактивация ТС/водителей (ТЗ 5.2). */
export function addFleetVehicle(params: {
  companyId: string;
  residency: Residency;
  companyIdentifier: string; // БИН/рег.номер — для маскированного отображения на карте
  grnz: string;
  category: VehicleCategory;
}) {
  const vehicleId = generateId('veh');
  useUserStore.getState().addVehicle({
    id: vehicleId,
    ownerKind: 'company',
    ownerId: params.companyId,
    grnz: params.grnz,
    category: params.category,
    active: true,
  });

  const spec = deriveUlCardSpec({ residency: params.residency, category: params.category });
  const card = materializeCard(spec, { vehicleId, maskedIdentifier: maskIdentifier(params.companyIdentifier) });
  useCardStore.getState().addCard(card);

  return { vehicleId, card };
}

export function deactivateVehicle(vehicleId: string, cardId?: string) {
  useUserStore.getState().updateVehicle(vehicleId, { active: false });
  if (cardId) useCardStore.getState().deactivateCard(cardId);
}

export function assignDriver(params: { companyId: string; vehicleId: string; fio: string; iin: string }) {
  const driverId = generateId('driver');
  useUserStore.getState().addDriver({ id: driverId, companyId: params.companyId, iin: params.iin, fio: params.fio, active: true });
  useUserStore.getState().updateVehicle(params.vehicleId, { driverId });
  return { driverId };
}

export function unassignDriver(vehicleId: string, driverId: string) {
  useUserStore.getState().updateDriver(driverId, { active: false });
  useUserStore.getState().updateVehicle(vehicleId, { driverId: undefined });
}
