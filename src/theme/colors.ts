/**
 * Палитра JanarmAI (ТЗ раздел 8.1), продублированная в TS для мест,
 * где нужен хекс-код напрямую (Recharts, react-simple-maps), а не Tailwind-класс.
 * Источник истины по значениям — src/index.css (@theme).
 */
export const navy = {
  50: '#eef2f9',
  100: '#d6e0ef',
  200: '#adc1df',
  300: '#7e9ccb',
  400: '#4e71a8',
  500: '#2f5185',
  600: '#1f3c68',
  700: '#172e51',
  800: '#10213b',
  900: '#0a1728',
  950: '#060f1b',
} as const;

export const orange = {
  50: '#fff4eb',
  100: '#ffe4cc',
  200: '#ffc493',
  300: '#ffa35a',
  400: '#ff8a33',
  500: '#f97316',
  600: '#e05f0a',
  700: '#b84a08',
  800: '#923a08',
  900: '#772f08',
  950: '#431805',
} as const;

/**
 * Статусная триада риск-тиров (Analytics Deep Dive, разд. 2.2/4.2/4.3) — `ok`/`blocked` уже были
 * в проекте (лимит/легальность); `warning` (амбер) добавлен для Medium-тира и провалидирован
 * dataviz-скиллом вместе с ok/blocked как триада: `node validate_palette.js "#16a34a,#f59e0b,#dc2626"`
 * — ALL CHECKS PASS (CVD-разделение в допустимой 6–8 зоне легально при вторичном кодировании —
 * везде используется с иконкой/текстовой подписью, не только цветом, см. RiskBadge.tsx).
 */
export const status = {
  ok: '#16a34a',
  warning: '#f59e0b',
  blocked: '#dc2626',
} as const;

/**
 * Категориальная пара для графиков (Recharts/react-simple-maps) — валидирована skills/dataviz
 * (`validate_palette.js`, все проверки PASS в light И dark, включая контраст к белому и navy-950):
 * #3d63a0 (более насыщенный синий, чем бренд-navy-500 — тот не проходит порог хромы для графиков)
 * и #e05f0a (= orange-600 бренд-палитры). Используется как categorical-пара «СНТ/Продажи»,
 * «Резиденты/Нерезиденты», «Авторизации/Чеки ОФД» и т.п. — везде ровно 2 серии.
 */
export const chartCategorical = { navy: '#3d63a0', orange: '#e05f0a' } as const;

/** Последовательная шкала (один тон, светлый→тёмный) для тепловой карты — валидирована как ordinal-рамп. */
export const chartSequentialNavy = ['#7e9ccb', '#5580b8', '#3d63a0', '#1f3c68', '#0a1728'] as const;

export const chartPalette = [chartCategorical.navy, chartCategorical.orange];
