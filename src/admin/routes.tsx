import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layout/AdminLayout';
import { RouteStub } from '@/components/ui/RouteStub';
import { AdminLoginPage } from '@/features/auth/AdminLoginPage';
import { AdminDashboardPage } from '@/features/analytics/AdminDashboardPage';
import { CasesQueuePage } from '@/features/analytics/CasesQueuePage';
import { CaseDetailPage } from '@/features/analytics/CaseDetailPage';

/**
 * Дерево маршрутов аналитического модуля (тех.план раздел 4) — desktop-only.
 * /admin/login — вне AdminLayout: отдельная landing-страница, визуально не часть шапки дашборда (ТЗ 4.7).
 * /admin/cases, /admin/cases/:id — A-07/A-08, операционный слой (Analytics Deep Dive 4.3).
 */
export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="cases" element={<CasesQueuePage />} />
        <Route path="cases/:id" element={<CaseDetailPage />} />
        <Route index element={<RouteStub id="A-00" title="Вход администратора" description="Redirect на /admin/login" />} />
        <Route path="*" element={<RouteStub id="404" title="Страница не найдена" description="Проверьте адрес маршрута" />} />
      </Route>
    </Routes>
  );
}
