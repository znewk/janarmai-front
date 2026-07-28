import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CalendarDays } from 'lucide-react';
import { navy, orange } from '@/theme/colors';
import { cn } from '@/lib/utils';

export interface MuiDateFieldProps {
  /** ISO-дата `yyyy-MM-dd` (тот же формат, что и весь остальной проект использует для дат). */
  value: string;
  onChange: (value: string) => void;
  /** Плейсхолдер вместо убранного плавающего MUI-лейбла (см. комментарий ниже). */
  placeholder?: string;
  /** Подсветка как у `ACTIVE_TRIGGER_CLASS` в AnalyticsFilterBar — когда значение отличается от дефолтного. */
  active?: boolean;
  className?: string;
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

/**
 * Обёртка над MUI `DatePicker` под ISO-строку — используется только в `AnalyticsFilterBar.tsx`
 * (провайдеры темы/локализации — на уровне самого фильтра).
 *
 * Внутренний плавающий MUI-лейбл убран намеренно: остальные поля фильтра (`Select` из shadcn)
 * используют общий `FieldLabel` над контролом (иконка + uppercase 11px подпись), и плавающий
 * MUI-лейбл рядом с ними читался как элемент из другой дизайн-системы (см. правки по стилям
 * фильтра, PROGRESS.md). `AnalyticsFilterBar` теперь ставит один `FieldLabel` «Период» над парой
 * полей, а сюда передаётся только placeholder.
 *
 * Иконка календаря заменена на ту же `lucide-react`, что использует `ChevronDownIcon` в `Select`
 * (см. `select.tsx`) — раньше здесь оставалась встроенная MUI-иконка со своим IconButton-паддингом,
 * из-за чего дата-поле визуально отличалось от Select (другой значок, другой отступ от края,
 * другой цвет). Здесь она уменьшена и прижата к тому же отступу, что и шеврон у Select.
 *
 * Высота (42px) и радиус (6px) выровнены под `SelectTrigger`; конкретные значения — по факту
 * рендера в этом проекте на момент правки, при расхождении с реальной высотой Select достаточно
 * поправить `height`/`borderRadius` здесь в одном месте.
 */
export function MuiDateField({ value, onChange, placeholder = 'дд.мм.гггг', active, className }: MuiDateFieldProps) {
  return (
    <DatePicker
      value={parseISO(value)}
      onChange={(date) => onChange(toISO(date))}
      format="dd.MM.yyyy"
      slots={{
        openPickerIcon: () => <CalendarDays className="h-3.5 w-3.5" style={{ color: navy[400] }} />,
      }}
      slotProps={{
        openPickerButton: {
          sx: {
            padding: '4px',
            marginRight: '2px',
            '&:hover': { backgroundColor: '#f8fafc' },
          },
        },
        textField: {
          size: 'small',
          //@ts-ignore
          placeholder,
          className: cn(className),
          sx: {
            width: 140,
            '& .MuiOutlinedInput-root': {
              height: 42,
              borderRadius: '6px',
              backgroundColor: active ? '#fff7ed' : '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: active ? orange[300] : navy[100],
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: active ? orange[300] : navy[200],
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: orange[500],
                borderWidth: '1px',
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: '0 0 0 14px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: active ? orange[600] : navy[600],
            },
          },
        },
      }}
    />
  );
}