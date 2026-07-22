import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConsumerApp } from '@/app/routes';
import { AdminApp } from '@/admin/routes';

/**
 * Корневой роутер: два независимых дерева маршрутов (тех.план раздел 1, 4) —
 * потребительский модуль (/) и аналитический модуль (/admin).
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<ConsumerApp />} />
      </Routes>
    </BrowserRouter>
  );
}
