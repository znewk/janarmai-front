import { create } from 'zustand';
import { generateId } from '@/lib/id';

export type ToastVariant = 'info' | 'success' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  show: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

/** Глобальная очередь toast-уведомлений (S-21, 80%-предупреждение) — не персистится, живёт только в рамках сессии вкладки. */
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show: (toast) => {
    const id = generateId('toast');
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const showToast = (toast: Omit<ToastItem, 'id'>) => useToastStore.getState().show(toast);
