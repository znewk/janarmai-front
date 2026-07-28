import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { MapPin, Fuel as FuelIcon, Users, CreditCard, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { Button } from './button';
import { MuiDateField } from './MuiDateField';
import type { DashboardFilters } from '@/lib/analyticsCompute';
import { REGION_OPTIONS, FUEL_OPTIONS, DEFAULT_FILTERS } from '@/lib/analyticsCompute';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';
import type { FuelType } from '@/types/entities';
import { muiTheme } from '@/theme/muiTheme';
import { cn } from '@/lib/utils';

export type AnalyticsFilterField = 'date' | 'region' | 'fuel' | 'residency' | 'ownerType';

const ALL_FIELDS: AnalyticsFilterField[] = ['date', 'region', 'fuel', 'residency', 'ownerType'];

const RESIDENCY_OPTIONS: { value: DashboardFilters['residency']; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'resident', label: 'Резиденты' },
  { value: 'nonresident', label: 'Нерезиденты' },
];

const OWNER_TYPE_OPTIONS: { value: DashboardFilters['ownerType']; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'fl', label: 'ФЛ' },
  { value: 'ul', label: 'ЮЛ' },
];

interface AnalyticsFilterBarProps {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  fields?: AnalyticsFilterField[];
  className?: string;
}

function FieldLabel({ icon: Icon, children }: { icon: typeof MapPin; children: string }) {
  return (
    <Label className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-navy-400 uppercase">
      <Icon className="h-3 w-3" />
      {children}
    </Label>
  );
}

const ACTIVE_TRIGGER_CLASS = 'border-orange-300 bg-orange-50 text-orange-700';

/**
 * Единая строка глобальных фильтров дашборда (период/регион/марка/резидентство/тип держателя) —
 * по замечанию ПМ: должны влиять на все виджеты сразу, поэтому состояние фильтров живёт на
 * уровне `AdminDashboardPage` и прокидывается в вычисления `analyticsCompute.ts`.
 * Переиспользуется также как локальный мини-фильтр у отдельных виджетов (`fields` сужает набор).
 * Активные (не дефолтные) поля подсвечены оранжевым — чтобы было видно, что именно сейчас сужено.
 */
export function AnalyticsFilterBar({ filters, onChange, fields = ALL_FIELDS, className }: AnalyticsFilterBarProps) {
  const dateActive = filters.dateFrom !== DEFAULT_FILTERS.dateFrom || filters.dateTo !== DEFAULT_FILTERS.dateTo;
  const regionActive = filters.region !== 'all';
  const fuelActive = filters.fuelType !== 'all';
  const residencyActive = filters.residency !== 'all';
  const ownerActive = filters.ownerType !== 'all';
  const anyActive = fields.some(
    (f) =>
      (f === 'date' && dateActive) ||
      (f === 'region' && regionActive) ||
      (f === 'fuel' && fuelActive) ||
      (f === 'residency' && residencyActive) ||
      (f === 'ownerType' && ownerActive),
  );

  const handleReset = () => {
    const patch: Partial<DashboardFilters> = {};
    if (fields.includes('date')) {
      patch.dateFrom = DEFAULT_FILTERS.dateFrom;
      patch.dateTo = DEFAULT_FILTERS.dateTo;
    }
    if (fields.includes('region')) patch.region = 'all';
    if (fields.includes('fuel')) patch.fuelType = 'all';
    if (fields.includes('residency')) patch.residency = 'all';
    if (fields.includes('ownerType')) patch.ownerType = 'all';
    onChange(patch);
  };

  return (
    <div className={cn('flex flex-wrap items-end gap-4', className)}>
      {fields.includes('date') && (
        <ThemeProvider theme={muiTheme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <div className={cn('flex items-end gap-2 rounded-2xl p-1', dateActive && 'bg-orange-50')}>
              <MuiDateField label="Период с" value={filters.dateFrom} onChange={(v) => onChange({ dateFrom: v })} />
              <MuiDateField label="по" value={filters.dateTo} onChange={(v) => onChange({ dateTo: v })} />
            </div>
          </LocalizationProvider>
        </ThemeProvider>
      )}

      {fields.includes('region') && (
        <div className="space-y-1">
          <FieldLabel icon={MapPin}>Регион</FieldLabel>
          <Select value={filters.region} onValueChange={(v) => onChange({ region: v })}>
            <SelectTrigger aria-label="Регион" className={cn('w-[172px]', regionActive && ACTIVE_TRIGGER_CLASS)}>
              <SelectValue placeholder="Все регионы" />
            </SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === 'all' ? 'Все регионы' : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {fields.includes('fuel') && (
        <div className="space-y-1">
          <FieldLabel icon={FuelIcon}>Марка топлива</FieldLabel>
          <Select value={filters.fuelType} onValueChange={(v) => onChange({ fuelType: v as DashboardFilters['fuelType'] })}>
            <SelectTrigger aria-label="Марка топлива" className={cn('w-[150px]', fuelActive && ACTIVE_TRIGGER_CLASS)}>
              <SelectValue placeholder="Все марки" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f === 'all' ? 'Все марки' : FUEL_TYPE_LABEL[f as FuelType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {fields.includes('residency') && (
        <div className="space-y-1">
          <FieldLabel icon={Users}>Резидентство</FieldLabel>
          <Select value={filters.residency} onValueChange={(v) => onChange({ residency: v as DashboardFilters['residency'] })}>
            <SelectTrigger aria-label="Резидентство" className={cn('w-[140px]', residencyActive && ACTIVE_TRIGGER_CLASS)}>
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
        </div>
      )}

      {fields.includes('ownerType') && (
        <div className="space-y-1">
          <FieldLabel icon={CreditCard}>Держатель</FieldLabel>
          <Select value={filters.ownerType} onValueChange={(v) => onChange({ ownerType: v as DashboardFilters['ownerType'] })}>
            <SelectTrigger aria-label="Тип держателя карты" className={cn('w-[110px]', ownerActive && ACTIVE_TRIGGER_CLASS)}>
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
        </div>
      )}

      {anyActive && (
        <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-navy-400 hover:text-navy-700">
          <RotateCcw className="h-3.5 w-3.5" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
