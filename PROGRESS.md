# PROGRESS.md — JanarmAI MVP фронтенд

Журнал выполнения по этапам из `AGENT_BUILD_PLAN.md`. Для каждого этапа фиксируется: что сделано, как проверено, отклонения от плана.

---

## Этап 0 — Инициализация проекта

**Сделано:**
- Vite + React 18 + TypeScript (`npm create vite@latest . -- --template react-ts`, React пропинен на `^18.3.1` — в шаблоне по умолчанию был React 19, а тех.план требует React 18).
- Tailwind CSS подключён как **v4** через `@tailwindcss/vite` (CSS-first конфиг, без `tailwind.config.js`) — на момент разработки это актуальная мажорная версия в npm; поведение то же, что и у v3, синтаксис конфигурации отличается (`@theme` в CSS вместо JS-конфига). Отмечено как замена в рамках допустимых равнозначных решений (см. правила AGENT_BUILD_PLAN.md).
- `src/index.css` — токены палитры (белый / navy / orange) по разделу 8.1 ТЗ через директиву `@theme` (шкалы navy/orange 50–950, семантические токены `--color-limit-normal/warning`, `--color-status-ok/blocked`).
- `src/theme/colors.ts` — дублирование хекс-значений палитры в TS для мест, где Tailwind-классы не подходят (Recharts, react-simple-maps) — будет использовано на этапах 2 и 7.
- React Router v6+ (фактически установлен v7, обратно совместим по используемому API) с двумя независимыми корневыми деревьями:
  - `src/app/routes.tsx` + `src/app/layout/ConsumerLayout.tsx` — потребительский модуль, mobile-first контейнер (max-w-md, по центру).
  - `src/admin/routes.tsx` + `src/admin/layout/AdminLayout.tsx` — аналитический модуль, desktop-only (`min-w-[1280px]`), отдельный визуальный стиль (тёмный navy-фон, шапка «JanarmAI · Аналитика»).
  - `src/AppRouter.tsx` — корневой `BrowserRouter`, разводит `/admin/*` и `/*`.
- Заглушки (`RouteStub`) на все маршруты из карты маршрутов раздела 4 тех.плана: `/`, `/register/egov-bvu`, `/register/kmg`, `/register/kmg/foreign`, `/register/kmg/company`, `/register/kmg/company-foreign`, `/login`, `/card`, `/cabinet`, `/cabinet/history`, `/admin/login`, `/admin/dashboard` + catch-all 404 в обоих деревьях.
- Алиас `@/*` → `src/*` в `tsconfig.app.json` и `vite.config.ts`.
- Создана полная структура каталогов `src/` по разделу 3 тех.плана: `app/`, `admin/`, `features/{onboarding,auth,card,cabinet-fl,cabinet-ul,analytics}/`, `components/ui/`, `mocks/{seed,api}/`, `store/`, `theme/`, `dev/`, `types/`.

**Как проверено:**
- `npx tsc -b --noEmit` — без ошибок.
- `npm run build` — сборка проходит чисто (`dist/index.html`, `dist/assets/*`, ~5.5с).
- `npm run dev` — dev-сервер поднят на порту 5173; проверены через `curl` (HTTP 200) все 12 маршрутов из карты маршрутов, включая заведомо несуществующий (проверка catch-all).

**Отклонения от плана:**
- Tailwind CSS установился как мажорная v4 (а не v3, которая, вероятно, подразумевалась при написании тех.плана) — конфигурация через `@theme` в CSS вместо `tailwind.config.js`. Функционально эквивалентно, зафиксировано как допустимая замена.
- В процессе установки пакетов возникал конфликт из-за двух параллельных `npm install` в одной директории (повредил `node_modules`) — исправлено полной переустановкой (`rm -rf node_modules package-lock.json && npm install`).

---

## Этап 1 — Мок-слой

**Сделано:**
- `src/types/entities.ts`, `src/types/mock.ts` — модель данных мок-сущностей (тех.план раздел 7): `User`, `Company`, `Driver`, `Vehicle`, `Card`, `Transaction`, `Station`, `AdminUser`, `MockCheckResult<T>` с кодами ошибок `MockErrorCode`.
- `src/lib/cardRules.ts` — единое бизнес-правило выпуска карт при регистрации (используется и в seed, и позже в Этапе 3): для ФЛ-резидента личный лимит легковой категории (100 л) не дублируется на человека независимо от числа легковых ТС, на каждый грузовик — отдельная карта (300 л/ТС); для ЮЛ лимит всегда «на ТС»; для иностранца/ЮЛ-нерезидента — карта без суточного потолка (`dailyLimitL: null`), без льготной цены. Допущение по неоднозначности ТЗ зафиксировано в `OPEN_QUESTIONS.md`.
- `src/lib/{id,time,mask}.ts` — генерация id/QR-токенов, расчёт ближайшей полуночи по времени Астаны (сброс лимита), маскирование ИИН/БИН.
- `src/mocks/seed/*.ts` — стартовые данные: 5 пользователей (по одному на каждую ветку регистрации/входа: ФЛ-резидент eGov, ФЛ-резидент КМГ, ФЛ-иностранец, директор ЮЛ-резидента, директор ЮЛ-нерезидента), 2 компании, 8 ТС, 3 водителя, справочник лимитов/цен (100/300 л, мок-цены льготная/предельная по видам топлива), 15 АЗС по областям РК (с пометкой приграничных с РФ регионов — под будущую тепловую карту Этапа 7), 3 служебных аккаунта аналитиков, карты (сгенерированы через `cardRules` из seed-пользователей/ТС/компаний), стартовая история заправок (11 транзакций).
- `src/mocks/api/*.ts` — имитация проверок: `checkGbdFl`, `checkBmg`, `sendSmsCode`/`verifySmsCode` (identity.ts), `checkBerkut`/`verifyLiveness` (foreigner.ts), `checkVehicleRegistry`/`checkOgpoInsurance` (vehicle.ts, ЕСБД/ОГПО), `checkGbdUl`/`signEcp` (company.ts), `checkAdminCredentials` (admin.ts). Общий формат ответа `{status:'success', data}` / `{status:'error', errorCode, message}` через `mockSuccess`/`mockError` (`mockRequest.ts`), задержка 300–1500 мс (`config.ts`). Детерминированные сценарии ошибок — по признаку ИИН/БИН/паспорта/ГРНЗ, правило зафиксировано в `OPEN_QUESTIONS.md`.
- `src/store/*.ts` — 4 Zustand-стора с `persist` в localStorage: `user.store.ts` (пользователь/сессия + рантайм-база users/companies/vehicles/drivers, пополняемая при регистрации), `card.store.ts` (карты и лимиты: `consumeLimit`, `resetDaily`, `regenerateQrToken`), `transaction.store.ts` (история), `admin.store.ts` (админ-сессия). `resetDemoData.ts` — сброс всех сторов к seed по кнопке «Сбросить демо-данные» (будет подключена в UI на Этапе 6/8).
- `src/dev/MocksDevPage.tsx` на маршруте `/dev/mocks` — визуальная проверка мок-вызовов и состояния сторов вне бизнес-потоков (по аналогии с `/dev/components` из Этапа 2).
- `scripts/smoke-mocks.ts`, `scripts/smoke-persist.ts` + npm-скрипты `smoke:mocks`/`smoke:persist` (через `tsx`) — дымовые скрипты для проверки мок-слоя и persist-слоя из консоли без браузера.

**Как проверено:**
- `npx tsc -b --noEmit` и `npm run build` — без ошибок.
- `npm run smoke:mocks` — все 10 проверок из консоли вернули корректный `{status, data|errorCode, message}`, включая все запланированные негативные сценарии (ГБД ФЛ не найден/несовпадение, БМГ, SMS неверный код, «Беркут» дубликат, ИС «Автомобиль» не найдено, вход администратора неверный); суммарная задержка 11 вызовов ≈9с, что соответствует диапазону 300–1500мс на вызов.
- `npm run smoke:persist` — с полифиллом `localStorage` в Node подтверждено: (1) `consumeLimit` корректно обновляет карту в сторе, (2) обновлённое состояние физически записывается в `localStorage` под ключами `janarmai-card-store`/`janarmai-admin-store` (проверено содержимое сериализованной записи), (3) `reset()` возвращает сторы к seed-состоянию. Это подтверждает контракт persist-слоя, лежащий в основе требования «состояние переживает перезагрузку страницы» — сам факт перезагрузки браузера дополнительно не тестировался (headless-браузер недоступен в этом окружении), библиotека zustand/persist общепринята и стабильна.
- Dev-сервер (`npm run dev`) поднят, маршрут `/dev/mocks` отдаёт 200.

**Отклонения/примечания:**
- Установка `tsx` (как devDependency для дымовых скриптов) подтянула транзитивную уязвимость high severity (ReDoS в `d3-color` через `react-simple-maps`, `npm audit`). Не исправлено намеренно: fix ломает `react-simple-maps` до v1 (несовместимо с тех.планом, который явно требует эту библиотеку для карты РК), а сама уязвимость не эксплуатируема в контексте демо со статичными встроенными данными (нет обработки пользовательского ввода через уязвимый регэксп).
