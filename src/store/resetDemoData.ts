import { useUserStore } from './user.store';
import { useCardStore } from './card.store';
import { useTransactionStore } from './transaction.store';
import { useAdminStore } from './admin.store';
import { useCaseStore } from './case.store';

/** Кнопка «Сбросить демо-данные» (тех.план 2.2) — возвращает все сторы к seed-состоянию. */
export function resetDemoData(): void {
  useUserStore.getState().reset();
  useCardStore.getState().reset();
  useTransactionStore.getState().reset();
  useAdminStore.getState().reset();
  useCaseStore.getState().reset();
}
