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
        <Route
          path="login"
          element={<RouteStub id="S-15..S-17" title="Авторизация" description="Вход в уже созданный аккаунт: eGov/БВУ, телефон+SMS, БИН+код" />}
        />
        <Route
          path="card"
          element={<RouteStub id="S-18" title="Карта / QR" description="MunaiCard, динамический QR, остаток лимита, симуляция заправки" />}
        />
        <Route
          path="cabinet"
          element={<RouteStub id="S-22/S-24" title="Личный кабинет" description="Кабинет ФЛ или ЮЛ в зависимости от типа пользователя" />}
        />
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
