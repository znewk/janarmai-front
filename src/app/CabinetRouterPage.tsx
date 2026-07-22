import { useUserStore } from '@/store/user.store';
import { CabinetFlPage } from '@/features/cabinet-fl/CabinetFlPage';
import { CabinetUlPage } from '@/features/cabinet-ul/CabinetUlPage';

/** /cabinet — выбирает кабинет ФЛ (S-22) или ЮЛ (S-24) по текущей сессии (ТЗ 5.1/5.2). */
export function CabinetRouterPage() {
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  return currentCompanyId ? <CabinetUlPage /> : <CabinetFlPage />;
}
