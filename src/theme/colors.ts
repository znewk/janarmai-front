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

export const status = {
  ok: '#16a34a',
  blocked: '#dc2626',
} as const;

export const chartPalette = [navy[500], orange[500], navy[300], orange[300], navy[700], orange[700]];
