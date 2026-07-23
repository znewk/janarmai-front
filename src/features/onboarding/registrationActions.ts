import type { Card, Channel, Residency, VehicleCategory } from '@/types/entities';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { deriveFlCardSpecs, deriveUlCardSpec, materializeCard } from '@/lib/cardRules';
import { maskIdentifier } from '@/lib/mask';
import { generateId } from '@/lib/id';

interface FlRegistrationParams {
  residency: Residency;
  fio: string;
  phone: string;
  channel: Channel;
  iin?: string;
  passportNumber?: string;
  /** Собственное ТС — не более одного на демо-сценарий S-08 (в отличие от автопарка ЮЛ, S-13). */
  vehicle?: { grnz: string; category: VehicleCategory };
}

/**
 * Завершение регистрации ФЛ (все 3 ветки: eGov/БВУ, КМГ-резидент, КМГ-иностранец).
 * Сразу устанавливает сессию (автологин) — по обновлённому ТЗ пользователь после регистрации
 * попадает прямо на экран карты (`/card`) без промежуточного экрана «Выпуск карты», а этот экран
 * требует активной сессии, чтобы показать выпущенные карты.
 */
export function finalizeFlRegistration(params: FlRegistrationParams): { userId: string; cards: Card[] } {
  const userId = generateId('user');
  useUserStore.getState().registerUser({
    id: userId,
    type: 'fl',
    residency: params.residency,
    fio: params.fio,
    phone: params.phone,
    channel: params.channel,
    iin: params.iin,
    passportNumber: params.passportNumber,
    createdAt: new Date().toISOString(),
  });

  let vehicleId: string | undefined;
  if (params.vehicle) {
    vehicleId = generateId('veh');
    useUserStore.getState().addVehicle({
      id: vehicleId,
      ownerKind: 'user',
      ownerId: userId,
      grnz: params.vehicle.grnz,
      category: params.vehicle.category,
      active: true,
    });
  }

  const specs = deriveFlCardSpecs({
    residency: params.residency,
    vehicleCategories: params.vehicle ? [params.vehicle.category] : [],
  });
  const maskedIdentifier = maskIdentifier(params.iin ?? params.passportNumber);
  const cards: Card[] = [];
  for (const spec of specs) {
    const card = materializeCard(spec, {
      userId: spec.ownerKind === 'user' ? userId : undefined,
      vehicleId: spec.ownerKind === 'vehicle' ? vehicleId : undefined,
      maskedIdentifier,
    });
    useCardStore.getState().addCard(card);
    cards.push(card);
  }

  useUserStore.getState().login(userId);
  return { userId, cards };
}

interface UlRegistrationParams {
  residency: Residency;
  name: string;
  bin?: string;
  registrationNumber?: string;
  phone: string;
  directorFio: string;
  directorIdentifier?: string; // ИИН (резидент) или номер паспорта (нерезидент)
  vehicles: { grnz: string; category: VehicleCategory; driverFio?: string; driverIin?: string }[];
}

/**
 * Завершение регистрации ЮЛ (резидент/нерезидент), автопарк S-13/S-14.
 * Сразу устанавливает сессию (автологин директора + компании) — по обновлённому ТЗ пользователь
 * после регистрации попадает прямо в кабинет ЮЛ (`/cabinet`) без промежуточного экрана «Выпуск карты».
 */
export function finalizeUlRegistration(params: UlRegistrationParams): { companyId: string; cards: Card[] } {
  const directorId = generateId('user');
  useUserStore.getState().registerUser({
    id: directorId,
    type: 'fl',
    residency: params.residency,
    fio: params.directorFio,
    phone: params.phone,
    channel: 'kmg',
    iin: params.residency === 'resident' ? params.directorIdentifier : undefined,
    passportNumber: params.residency === 'nonresident' ? params.directorIdentifier : undefined,
    createdAt: new Date().toISOString(),
  });

  const companyId = generateId('company');
  useUserStore.getState().registerCompany({
    id: companyId,
    residency: params.residency,
    name: params.name,
    bin: params.bin,
    registrationNumber: params.registrationNumber,
    directorId,
    phone: params.phone,
    channel: 'kmg',
    createdAt: new Date().toISOString(),
  });

  const maskedIdentifier = maskIdentifier(params.bin ?? params.registrationNumber);
  const cards: Card[] = [];

  for (const v of params.vehicles) {
    const vehicleId = generateId('veh');
    let driverId: string | undefined;
    if (v.driverFio) {
      driverId = generateId('driver');
      useUserStore.getState().addDriver({ id: driverId, companyId, iin: v.driverIin ?? '', fio: v.driverFio, active: true });
    }
    useUserStore.getState().addVehicle({
      id: vehicleId,
      ownerKind: 'company',
      ownerId: companyId,
      grnz: v.grnz,
      category: v.category,
      driverId,
      active: true,
    });
    const spec = deriveUlCardSpec({ residency: params.residency, category: v.category });
    const card = materializeCard(spec, { vehicleId, maskedIdentifier });
    useCardStore.getState().addCard(card);
    cards.push(card);
  }

  useUserStore.getState().login(directorId, companyId);
  return { companyId, cards };
}
