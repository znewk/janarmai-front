import type { Card, Vehicle } from '@/types/entities';

/**
 * Единая логика подбора карт текущей сессии (ФЛ или ЮЛ) — используется на экране карты (Этап 5)
 * и в личном кабинете (Этап 6). Грузовые карты привязаны к `vehicleId`, а не к `userId` (см. PROGRESS.md, Этап 3) —
 * поэтому фильтрация учитывает оба варианта владения.
 */
export function selectSessionCards(params: {
  cards: Card[];
  vehicles: Vehicle[];
  currentUserId: string | null;
  currentCompanyId: string | null;
}): Card[] {
  if (params.currentCompanyId) {
    const vehicleIds = params.vehicles.filter((v) => v.ownerId === params.currentCompanyId).map((v) => v.id);
    return params.cards.filter((c) => c.vehicleId && vehicleIds.includes(c.vehicleId) && c.active);
  }
  if (params.currentUserId) {
    const vehicleIds = params.vehicles.filter((v) => v.ownerKind === 'user' && v.ownerId === params.currentUserId).map((v) => v.id);
    return params.cards.filter((c) => (c.userId === params.currentUserId || (c.vehicleId && vehicleIds.includes(c.vehicleId))) && c.active);
  }
  return [];
}
