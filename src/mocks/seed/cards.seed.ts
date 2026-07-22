import type { Card } from '@/types/entities';
import { deriveFlCardSpecs, deriveUlCardSpec } from '@/lib/cardRules';
import { maskIdentifier } from '@/lib/mask';
import { getNextAstanaMidnightISO } from '@/lib/time';
import { generateQrToken } from '@/lib/id';
import { usersSeed } from './users.seed';
import { vehiclesSeed } from './vehicles.seed';
import { companiesSeed } from './companies.seed';

const NOW_ISO = '2026-07-22T04:00:00.000Z';

function buildCard(partial: Omit<Card, 'resetAt' | 'qrToken' | 'qrUpdatedAt' | 'usedTodayL' | 'active'>): Card {
  return {
    ...partial,
    usedTodayL: 0,
    resetAt: getNextAstanaMidnightISO(new Date(NOW_ISO)),
    qrToken: generateQrToken(),
    qrUpdatedAt: NOW_ISO,
    active: true,
  };
}

function buildFlCards(): Card[] {
  const cards: Card[] = [];
  for (const user of usersSeed) {
    if (user.id.startsWith('user_director_')) continue; // директора получают карты только если сами являются держателями (в MVP — нет)
    const vehicles = vehiclesSeed.filter((v) => v.ownerKind === 'user' && v.ownerId === user.id);
    const specs = deriveFlCardSpecs({ residency: user.residency, vehicleCategories: vehicles.map((v) => v.category) });
    let truckIdx = 0;
    for (const spec of specs) {
      const vehicleForCard = spec.ownerKind === 'vehicle' ? vehicles.filter((v) => v.category === 'truck')[truckIdx++] : undefined;
      cards.push(
        buildCard({
          id: `card_${user.id}${vehicleForCard ? `_${vehicleForCard.id}` : ''}`,
          cardType: spec.cardType,
          ownerKind: spec.ownerKind,
          userId: spec.ownerKind === 'user' ? user.id : undefined,
          vehicleId: vehicleForCard?.id,
          maskedIdentifier: maskIdentifier(user.iin ?? user.passportNumber),
          dailyLimitL: spec.dailyLimitL,
          priceEligible: spec.priceEligible,
        }),
      );
    }
  }
  return cards;
}

function buildUlCards(): Card[] {
  const cards: Card[] = [];
  for (const company of companiesSeed) {
    const vehicles = vehiclesSeed.filter((v) => v.ownerKind === 'company' && v.ownerId === company.id);
    for (const vehicle of vehicles) {
      const spec = deriveUlCardSpec({ residency: company.residency, category: vehicle.category });
      cards.push(
        buildCard({
          id: `card_${vehicle.id}`,
          cardType: spec.cardType,
          ownerKind: spec.ownerKind,
          vehicleId: vehicle.id,
          maskedIdentifier: maskIdentifier(company.bin ?? company.registrationNumber),
          dailyLimitL: spec.dailyLimitL,
          priceEligible: spec.priceEligible,
        }),
      );
    }
  }
  return cards;
}

export const cardsSeed: Card[] = [...buildFlCards(), ...buildUlCards()];
