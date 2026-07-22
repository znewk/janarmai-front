import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Card } from '@/types/entities';
import { cardsSeed } from '@/mocks/seed';
import { getNextAstanaMidnightISO } from '@/lib/time';
import { generateQrToken } from '@/lib/id';

/** Карты и лимиты (тех.план 2.2, 7): рантайм-состояние остатков и истории QR-токенов. */
interface CardState {
  cards: Card[];

  addCard: (card: Card) => void;
  /** Увеличивает «использовано сегодня» на volumeL (заправка, S-20) — без ограничения потолком: превышение обслуживается по рыночной цене (ТЗ 5.0). */
  consumeLimit: (cardId: string, volumeL: number) => void;
  resetDaily: (cardId: string) => void;
  resetAllDaily: () => void;
  regenerateQrToken: (cardId: string) => void;
  deactivateCard: (cardId: string) => void;
  reset: () => void;
}

const initialData = { cards: cardsSeed };

export const useCardStore = create<CardState>()(
  persist(
    (set) => ({
      ...initialData,

      addCard: (card) => set((s) => ({ cards: [...s.cards, card] })),
      consumeLimit: (cardId, volumeL) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === cardId ? { ...c, usedTodayL: c.usedTodayL + volumeL } : c)),
        })),
      resetDaily: (cardId) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === cardId ? { ...c, usedTodayL: 0, resetAt: getNextAstanaMidnightISO() } : c)),
        })),
      resetAllDaily: () =>
        set((s) => ({ cards: s.cards.map((c) => ({ ...c, usedTodayL: 0, resetAt: getNextAstanaMidnightISO() })) })),
      regenerateQrToken: (cardId) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, qrToken: generateQrToken(), qrUpdatedAt: new Date().toISOString() } : c,
          ),
        })),
      deactivateCard: (cardId) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === cardId ? { ...c, active: false } : c)) })),
      reset: () => set({ ...initialData }),
    }),
    { name: 'janarmai-card-store', storage: createJSONStorage(() => localStorage) },
  ),
);
