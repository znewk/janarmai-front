import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Case, CaseStatus } from '@/types/entities';
import { casesSeed } from '@/mocks/seed';

/**
 * Очередь кейсов (Analytics Deep Dive, разд. 4.3) — статус и заметка аналитика мутируемы на A-08
 * (`CaseDetailPage`). «Без сохранения на бэкенде» трактуется как «нет реального бэкенда» (верно для
 * всего проекта) — состояние персистится в localStorage той же конвенцией, что и остальные сторы,
 * иначе заметка стиралась бы при переходе между экранами (см. OPEN_QUESTIONS.md).
 */
interface CaseState {
  cases: Case[];
  updateStatus: (caseId: string, status: CaseStatus) => void;
  updateNote: (caseId: string, note: string) => void;
  reset: () => void;
}

const initialData = { cases: casesSeed };

export const useCaseStore = create<CaseState>()(
  persist(
    (set) => ({
      ...initialData,
      updateStatus: (caseId, status) =>
        set((s) => ({ cases: s.cases.map((c) => (c.id === caseId ? { ...c, status } : c)) })),
      updateNote: (caseId, note) =>
        set((s) => ({ cases: s.cases.map((c) => (c.id === caseId ? { ...c, analystNote: note } : c)) })),
      reset: () => set({ ...initialData }),
    }),
    { name: 'janarmai-case-store', storage: createJSONStorage(() => localStorage) },
  ),
);
