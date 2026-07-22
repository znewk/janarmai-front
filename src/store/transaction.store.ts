import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Transaction } from '@/types/entities';
import { transactionsSeed } from '@/mocks/seed';

/** История заправок (тех.план 2.2, 7). */
interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  reset: () => void;
}

const initialData = { transactions: transactionsSeed };

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      ...initialData,
      addTransaction: (transaction) => set((s) => ({ transactions: [transaction, ...s.transactions] })),
      reset: () => set({ ...initialData }),
    }),
    { name: 'janarmai-transaction-store', storage: createJSONStorage(() => localStorage) },
  ),
);
