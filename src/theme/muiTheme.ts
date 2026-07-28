import { createTheme } from '@mui/material/styles';
import { navy, orange } from './colors';

/**
 * Тема MUI для дейтпикеров аналитического фильтра (`AnalyticsFilterBar.tsx`) — единственное
 * место в проекте, где используется MUI (по прямому запросу пользователя, остальной UI — на
 * shadcn/Tailwind). Палитра подогнана под фирменные navy/orange, чтобы дейтпикер не выглядел
 * инородным элементом на дашборде.
 *
 * ВАЖНО: borderRadius и видимый бордер (`notchedOutline`) намеренно выровнены под `SelectTrigger`
 * из shadcn (соседние поля фильтра) — раньше здесь был `borderRadius: 999` (полная пилюля) и
 * `notchedOutline: { borderColor: 'transparent' }` (бордер невидим), из-за чего дата-поля читались
 * как элемент другой дизайн-системы рядом с обычными Select (см. правки по стилям фильтра,
 * PROGRESS.md). Активное/hover/focus состояние подсвечивается точечно через `MuiDateField.tsx`
 * (проп `active`) — здесь заданы только базовые (неактивные) значения.
 */
export const muiTheme = createTheme({
  palette: {
    primary: { main: orange[500], dark: orange[600], light: orange[300], contrastText: '#fff' },
    secondary: { main: navy[600] },
    text: { primary: navy[900], secondary: navy[400] },
  },
  typography: {
    fontFamily: 'inherit',
    fontSize: 13,
  },
  shape: { borderRadius: 6 },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#fff',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: navy[200],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: orange[500],
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: navy[100],
        },
        input: {
          padding: '8px 10px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: navy[600],
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          color: navy[400],
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});