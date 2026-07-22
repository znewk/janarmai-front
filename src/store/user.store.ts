import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Company, Driver, User, Vehicle } from '@/types/entities';
import { usersSeed, companiesSeed, vehiclesSeed, driversSeed } from '@/mocks/seed';

/**
 * Пользователь/сессия (тех.план 2.2, 7): рантайм-«база» пользователей, компаний, ТС, водителей —
 * пополняется в ходе регистрации (Этап 3) — и текущая авторизованная сессия потребительского модуля.
 */
interface UserState {
  users: User[];
  companies: Company[];
  vehicles: Vehicle[];
  drivers: Driver[];
  currentUserId: string | null;
  /** Если сессия — ЮЛ (вход админа автопарка), здесь id компании, от имени которой действует directorId=currentUserId. */
  currentCompanyId: string | null;

  login: (userId: string, companyId?: string) => void;
  logout: () => void;
  registerUser: (user: User) => void;
  registerCompany: (company: Company) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicleId: string, patch: Partial<Vehicle>) => void;
  addDriver: (driver: Driver) => void;
  updateDriver: (driverId: string, patch: Partial<Driver>) => void;
  reset: () => void;
}

const initialData = {
  users: usersSeed,
  companies: companiesSeed,
  vehicles: vehiclesSeed,
  drivers: driversSeed,
  currentUserId: null as string | null,
  currentCompanyId: null as string | null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialData,

      login: (userId, companyId) => set({ currentUserId: userId, currentCompanyId: companyId ?? null }),
      logout: () => set({ currentUserId: null, currentCompanyId: null }),
      registerUser: (user) => set((s) => ({ users: [...s.users, user] })),
      registerCompany: (company) => set((s) => ({ companies: [...s.companies, company] })),
      addVehicle: (vehicle) => set((s) => ({ vehicles: [...s.vehicles, vehicle] })),
      updateVehicle: (vehicleId, patch) =>
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, ...patch } : v)) })),
      addDriver: (driver) => set((s) => ({ drivers: [...s.drivers, driver] })),
      updateDriver: (driverId, patch) =>
        set((s) => ({ drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, ...patch } : d)) })),
      reset: () => set({ ...initialData }),
    }),
    { name: 'janarmai-user-store', storage: createJSONStorage(() => localStorage) },
  ),
);
