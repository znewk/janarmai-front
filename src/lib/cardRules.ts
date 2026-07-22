import type { Card, CardType, Residency, VehicleCategory } from '@/types/entities';
import { DAILY_LIMIT_L, PERSONAL_DAILY_LIMIT_L } from '@/mocks/seed/limits.seed';
import { getNextAstanaMidnightISO } from '@/lib/time';
import { generateId, generateQrToken } from '@/lib/id';

/**
 * Правило выпуска карт при регистрации (ТЗ раздел 3, 4.1–4.5, 8.5 S-10):
 * — ФЛ-резидент: лимит легковой категории — «на человека» (100 л), одна карта на пользователя,
 *   не умножается на число легковых ТС; лимит грузовой категории — «на ТС» (300 л), отдельная карта на каждый грузовик.
 *   Если своего ТС нет (вписан в чужой ОГПО) — выпускается персональная карта с тем же личным лимитом.
 * — ФЛ-иностранец: льготный лимит не применяется — одна карта без суточного потолка, по предельной цене.
 * — ЮЛ (резидент/нерезидент): лимит всегда «на ТС» — отдельная карта на каждое ТС автопарка;
 *   у нерезидента, как и у иностранца, льготная цена не применяется.
 *
 * Допущение (см. OPEN_QUESTIONS.md): если у ФЛ-резидента несколько легковых ТС, персональная карта не дублируется —
 * это не описано явно в презентации-концепции, трактовка выбрана как наиболее логичная («лимит на человека»).
 */

export interface CardSpec {
  cardType: CardType;
  ownerKind: 'user' | 'vehicle';
  dailyLimitL: number | null;
  priceEligible: boolean;
}

export function deriveFlCardSpecs(params: { residency: Residency; vehicleCategories: VehicleCategory[] }): CardSpec[] {
  if (params.residency === 'nonresident') {
    return [{ cardType: 'fl_person', ownerKind: 'user', dailyLimitL: null, priceEligible: false }];
  }

  const specs: CardSpec[] = [];
  const hasPassengerOrNoVehicle =
    params.vehicleCategories.length === 0 || params.vehicleCategories.includes('passenger');
  if (hasPassengerOrNoVehicle) {
    specs.push({ cardType: 'fl_passenger', ownerKind: 'user', dailyLimitL: PERSONAL_DAILY_LIMIT_L, priceEligible: true });
  }
  const truckCount = params.vehicleCategories.filter((c) => c === 'truck').length;
  for (let i = 0; i < truckCount; i += 1) {
    specs.push({ cardType: 'fl_truck', ownerKind: 'vehicle', dailyLimitL: DAILY_LIMIT_L.truck, priceEligible: true });
  }
  return specs;
}

export function deriveUlCardSpec(params: { residency: Residency; category: VehicleCategory }): CardSpec {
  return {
    cardType: params.category === 'passenger' ? 'ul_passenger' : 'ul_truck',
    ownerKind: 'vehicle',
    dailyLimitL: params.residency === 'resident' ? DAILY_LIMIT_L[params.category] : null,
    priceEligible: params.residency === 'resident',
  };
}

/** Материализация карты из спецификации при выпуске (S-10) — новая карта, свежий QR, сброс в 00:00 Астаны. */
export function materializeCard(spec: CardSpec, owner: { userId?: string; vehicleId?: string; maskedIdentifier: string }): Card {
  return {
    id: generateId('card'),
    cardType: spec.cardType,
    ownerKind: spec.ownerKind,
    userId: owner.userId,
    vehicleId: owner.vehicleId,
    maskedIdentifier: owner.maskedIdentifier,
    dailyLimitL: spec.dailyLimitL,
    priceEligible: spec.priceEligible,
    usedTodayL: 0,
    resetAt: getNextAstanaMidnightISO(),
    qrToken: generateQrToken(),
    qrUpdatedAt: new Date().toISOString(),
    active: true,
  };
}
