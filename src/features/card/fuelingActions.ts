import type { Card, FuelType, PriceType, Transaction } from '@/types/entities';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { stationsSeed, PRICE_KZT } from '@/mocks/seed';
import { generateId } from '@/lib/id';

export interface FuelingResult {
  transaction: Transaction;
  card: Card;
  remainingL: number | null;
  warningThresholdReached: boolean;
}

/**
 * Завершение демо-симуляции заправки (S-20 → S-21, ТЗ 5.0):
 * если объём укладывается в остаток льготного лимита — вся транзакция по льготной цене,
 * иначе — целиком по предельной (упрощение единого priceType на транзакцию, см. OPEN_QUESTIONS.md).
 * usedTodayL увеличивается на весь фактический объём независимо от цены — лимит показывает реальное потребление.
 */
export function simulateFueling(params: { cardId: string; fuelType: FuelType; volumeL: number }): FuelingResult {
  const card = useCardStore.getState().cards.find((c) => c.id === params.cardId);
  if (!card) throw new Error(`Card not found: ${params.cardId}`);

  const remainingBeforeL = card.dailyLimitL !== null ? Math.max(card.dailyLimitL - card.usedTodayL, 0) : null;
  const priceType: PriceType = card.priceEligible && remainingBeforeL !== null && params.volumeL <= remainingBeforeL ? 'preferential' : 'market';
  const pricePerLiterKzt = PRICE_KZT[priceType][params.fuelType];

  const station = stationsSeed[Math.floor(Math.random() * stationsSeed.length)];

  const transaction: Transaction = {
    id: generateId('txn'),
    cardId: card.id,
    dateTime: new Date().toISOString(),
    fuelType: params.fuelType,
    volumeL: params.volumeL,
    stationId: station.id,
    stationName: station.name,
    priceType,
    pricePerLiterKzt,
    totalKzt: Math.round(pricePerLiterKzt * params.volumeL),
  };

  useCardStore.getState().consumeLimit(card.id, params.volumeL);
  useTransactionStore.getState().addTransaction(transaction);

  const updatedCard = useCardStore.getState().cards.find((c) => c.id === card.id)!;
  const remainingL = updatedCard.dailyLimitL !== null ? Math.max(updatedCard.dailyLimitL - updatedCard.usedTodayL, 0) : null;
  const warningThresholdReached =
    updatedCard.dailyLimitL !== null && updatedCard.dailyLimitL > 0 && updatedCard.usedTodayL / updatedCard.dailyLimitL >= 0.8;

  return { transaction, card: updatedCard, remainingL, warningThresholdReached };
}
