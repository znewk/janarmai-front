import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layout/AdminLayout';
import { RouteStub } from '@/components/ui/RouteStub';

/**
 * Дерево маршрутов аналитического модуля (тех.план раздел 4) — desktop-only.
 */
export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route
          path="login"
          element={<RouteStub id="A-00" title="Вход администратора" description="Landing-страница логин + пароль, служебный аккаунт" />}
        />
        <Route
          path="dashboard"
          element={
            <RouteStub
              id="A-01..A-06"
              title="Аналитический дашборд"
              description="KPI, сверка СНТ vs реализация, тепловая карта РК, структура потребления, интеллектуальный контроль"
            />
          }
        />
        <Route index element={<RouteStub id="A-00" title="Вход администратора" description="Redirect на /admin/login" />} />
        <Route path="*" element={<RouteStub id="404" title="Страница не найдена" description="Проверьте адрес маршрута" />} />
      </Route>
    </Routes>
  );
}
