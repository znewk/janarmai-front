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
