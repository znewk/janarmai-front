import { Route, Routes } from 'react-router-dom';
import { ConsumerLayout } from './layout/ConsumerLayout';
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
import { CabinetPlaceholderPage } from '@/features/cabinet-fl/CabinetPlaceholderPage';
import { CardScreenPage } from '@/features/card/CardScreenPage';

/**
 * Дерево маршрутов потребительского модуля (тех.план раздел 4).
 * Заглушки будут заменены реальными экранами на соответствующих этапах AGENT_BUILD_PLAN.md.
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
        <Route path="card" element={<CardScreenPage />} />
        <Route path="cabinet" element={<CabinetPlaceholderPage />} />
        <Route
          path="cabinet/history"
          element={<RouteStub id="S-23/S-25" title="История заправок" description="Список с фильтрами: период, карта/ТС, АЗС, топливо" />}
        />
        <Route path="dev/mocks" element={<MocksDevPage />} />
        <Route path="dev/components" element={<ComponentsDevPage />} />
        <Route path="*" element={<RouteStub id="404" title="Страница не найдена" description="Проверьте адрес маршрута" />} />
      </Route>
    </Routes>
  );
}
