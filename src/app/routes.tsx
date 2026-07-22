import { Route, Routes } from 'react-router-dom';
import { ConsumerLayout } from './layout/ConsumerLayout';
import { RouteStub } from '@/components/ui/RouteStub';

/**
 * Дерево маршрутов потребительского модуля (тех.план раздел 4).
 * Заглушки будут заменены реальными экранами на соответствующих этапах AGENT_BUILD_PLAN.md.
 */
export function ConsumerApp() {
  return (
    <Routes>
      <Route element={<ConsumerLayout />}>
        <Route
          index
          element={
            <RouteStub id="S-00" title="Выбор канала входа" description="eGov Mobile / Приложение БВУ / Приложение КМГ" />
          }
        />
        <Route
          path="register/egov-bvu"
          element={
            <RouteStub
              id="S-01/S-02"
              title="Быстрая регистрация"
              description="Путь eGov/БВУ для ФЛ-резидента: согласие + SMS-код"
            />
          }
        />
        <Route
          path="register/kmg"
          element={
            <RouteStub
              id="S-03"
              title="Полная регистрация — выбор типа лица"
              description="Приложение КМГ: ФЛ-резидент / ФЛ-иностранец / ЮЛ-резидент / ЮЛ-нерезидент"
            />
          }
        />
        <Route
          path="register/kmg/foreign"
          element={<RouteStub id="S-06/S-07" title="Ветка ФЛ-иностранец" description="Паспорт (MRZ) + liveness, проверка ИС «Беркут»" />}
        />
        <Route
          path="register/kmg/company"
          element={<RouteStub id="S-11..S-14" title="Ветка ЮЛ-резидент" description="БИН + ЭЦП, ГБД ЮЛ, автопарк, водители" />}
        />
        <Route
          path="register/kmg/company-foreign"
          element={
            <RouteStub
              id="S-11..S-14"
              title="Ветка ЮЛ-нерезидент"
              description="Иностранная компания, верификация директора через «Беркут»"
            />
          }
        />
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
        <Route path="*" element={<RouteStub id="404" title="Страница не найдена" description="Проверьте адрес маршрута" />} />
      </Route>
    </Routes>
  );
}
