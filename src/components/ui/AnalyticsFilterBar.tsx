import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { MuiDateField } from './MuiDateField';
import type { DashboardFilters } from '@/lib/analyticsCompute';
import { REGION_OPTIONS, FUEL_OPTIONS } from '@/lib/analyticsCompute';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';
import type { FuelType } from '@/types/entities';
import { muiTheme } from '@/theme/muiTheme';

export type AnalyticsFilterField = 'date' | 'region' | 'fuel' | 'residency' | 'ownerType';

const ALL_FIELDS: AnalyticsFilterField[] = ['date', 'region', 'fuel', 'residency', 'ownerType'];

const RESIDENCY_OPTIONS: { value: DashboardFilters['residency']; label: string }[] = [
  { value: 'all', label: 'Резидентство: все' },
  { value: 'resident', label: 'Резиденты' },
  { value: 'nonresident', label: 'Нерезиденты' },
];

const OWNER_TYPE_OPTIONS: { value: DashboardFilters['ownerType']; label: string }[] = [
  { value: 'all', label: 'Держатель: все' },
  { value: 'fl', label: 'ФЛ' },
  { value: 'ul', label: 'ЮЛ' },
];

interface AnalyticsFilterBarProps {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  fields?: AnalyticsFilterField[];
  className?: string;
}

/**
 * Единая строка глобальных фильтров дашборда (период/регион/марка/резидентство/тип держателя) —
 * по замечанию ПМ: должны влиять на все виджеты сразу, поэтому состояние фильтров живёт на
 * уровне `AdminDashboardPage` и прокидывается в вычисления `analyticsCompute.ts`.
 * Переиспользуется также как локальный мини-фильтр у отдельных виджетов (`fields` сужает набор).
 */
export function AnalyticsFilterBar({ filters, onChange, fields = ALL_FIELDS, className }: AnalyticsFilterBarProps) {
  return (
    <div className={`flex flex-wrap items-end gap-3 ${className ?? ''}`}>
      {fields.includes('date') && (
        <ThemeProvider theme={muiTheme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <div className="flex items-end gap-2">
              <MuiDateField label="Период с" value={filters.dateFrom} onChange={(v) => onChange({ dateFrom: v })} />
              <MuiDateField label="по" value={filters.dateTo} onChange={(v) => onChange({ dateTo: v })} />
            </div>
          </LocalizationProvider>
        </ThemeProvider>
      )}

      {fields.includes('region') && (
        <Select value={filters.region} onValueChange={(v) => onChange({ region: v })}>
          <SelectTrigger aria-label="Регион">
            <SelectValue placeholder="Регион: все" />
          </SelectTrigger>
          <SelectContent>
            {REGION_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r === 'all' ? 'Регион: все' : r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {fields.includes('fuel') && (
        <Select value={filters.fuelType} onValueChange={(v) => onChange({ fuelType: v as DashboardFilters['fuelType'] })}>
          <SelectTrigger aria-label="Марка топлива">
            <SelectValue placeholder="Марка: все" />
          </SelectTrigger>
          <SelectContent>
            {FUEL_OPTIONS.map((f) => (
              <SelectItem key={f} value={f}>
                {f === 'all' ? 'Марка: все' : FUEL_TYPE_LABEL[f as FuelType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {fields.includes('residency') && (
        <Select value={filters.residency} onValueChange={(v) => onChange({ residency: v as DashboardFilters['residency'] })}>
          <SelectTrigger aria-label="Резидентство">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESIDENCY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {fields.includes('ownerType') && (
        <Select value={filters.ownerType} onValueChange={(v) => onChange({ ownerType: v as DashboardFilters['ownerType'] })}>
          <SelectTrigger aria-label="Тип держателя карты">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OWNER_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
