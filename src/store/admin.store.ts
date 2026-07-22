import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Админ-сессия аналитического модуля (тех.план 2.2, 7) — отдельная от потребительской сессии. */
interface AdminState {
  currentAdminId: string | null;
  login: (adminId: string) => void;
  logout: () => void;
  reset: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      currentAdminId: null,
      login: (adminId) => set({ currentAdminId: adminId }),
      logout: () => set({ currentAdminId: null }),
      reset: () => set({ currentAdminId: null }),
    }),
    { name: 'janarmai-admin-store', storage: createJSONStorage(() => localStorage) },
  ),
);
