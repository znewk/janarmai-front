import { Route, Routes } from 'react-router-dom';
import { ConsumerLayout } from './layout/ConsumerLayout';
import { AppShellLayout } from './layout/AppShellLayout';
import { RouteStub } from '@/components/ui/RouteStub';
import { MocksDevPage } from '@/dev/MocksDevPage';
import { ComponentsDevPage } from '@/dev/ComponentsDevPage';
import { ChannelSelectPage } from '@/features/onboarding/ChannelSelectPage';
import { EgovBvuRegisterPage } from '@/features/onboarding/EgovBvuRegisterPage';
import { KmgRegisterPage } from '@/features/onboarding/KmgRegisterPage';
import { ForeignRegisterPage } from '@/features/onboarding/ForeignRegisterPage';
import { CompanyRegisterPage } from '@/features/onboarding/CompanyRegisterPage';
import { CompanyForeignRegisterPage } from '@/features/onboarding/CompanyForeignRegisterPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { CardScreenPage } from '@/features/card/CardScreenPage';
import { CabinetRouterPage } from './CabinetRouterPage';
import { TransactionHistoryPage } from '@/features/cabinet-fl/TransactionHistoryPage';
import { HomePage } from '@/features/home/HomePage';

/**
 * Дерево маршрутов потребительского модуля (тех.план раздел 4).
 * Онбординг/вход — `ConsumerLayout` без табов; «залогиненная» часть (Главная/Карта/История/Кабинет) —
 * `AppShellLayout` с нижней таб-навигацией (редизайн в духе eGov Mobile 3.0, по запросу пользователя).
 */
export function ConsumerApp() {
  return (
    <Routes>
      <Route element={<ConsumerLayout />}>
        <Route index element={<ChannelSelectPage />} />
        <Route path="register/egov-bvu" element={<EgovBvuRegisterPage />} />
        <Route path="register/kmg" element={<KmgRegisterPage />} />
        <Route path="register/kmg/foreign" element={<ForeignRegisterPage />} />
        <Route path="register/kmg/company" element={<CompanyRegisterPage />} />
        <Route path="register/kmg/company-foreign" element={<CompanyForeignRegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="dev/mocks" element={<MocksDevPage />} />
        <Route path="dev/components" element={<ComponentsDevPage />} />
      </Route>

      <Route element={<AppShellLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="card" element={<CardScreenPage />} />
        <Route path="cabinet" element={<CabinetRouterPage />} />
        <Route path="cabinet/history" element={<TransactionHistoryPage />} />
      </Route>

      <Route path="*" element={<RouteStub id="404" title="Страница не найдена" description="Проверьте адрес маршрута" />} />
    </Routes>
  );
}
