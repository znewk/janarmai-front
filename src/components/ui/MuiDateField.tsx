import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export interface MuiDateFieldProps {
  label: string;
  /** ISO-дата `yyyy-MM-dd` (тот же формат, что и весь остальной проект использует для дат). */
  value: string;
  onChange: (value: string) => void;
}

function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Обёртка над MUI `DatePicker` под ISO-строку — используется только в `AnalyticsFilterBar.tsx` (провайдеры темы/локализации — на уровне самого фильтра). */
export function MuiDateField({ label, value, onChange }: MuiDateFieldProps) {
  return (
    <DatePicker
      label={label}
      value={parseISO(value)}
      onChange={(date) => onChange(toISO(date))}
      format="dd.MM.yyyy"
      slotProps={{ textField: { size: 'small', sx: { width: 152 } } }}
    />
  );
}
