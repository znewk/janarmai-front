import { createTheme } from '@mui/material/styles';
import { navy, orange } from './colors';

/**
 * Тема MUI для дейтпикеров аналитического фильтра (`AnalyticsFilterBar.tsx`) — единственное
 * место в проекте, где используется MUI (по прямому запросу пользователя, остальной UI — на
 * shadcn/Tailwind). Палитра подогнана под фирменные navy/orange, чтобы дейтпикер не выглядел
 * инородным элементом на дашборде.
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
  shape: { borderRadius: 10 },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: '#fff',
        },
        notchedOutline: {
          borderColor: 'transparent',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
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
          borderRadius: 14,
        },
      },
    },
  },
});
