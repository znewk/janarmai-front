import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { CalendarDays, MapPin, Fuel as FuelIcon, Users, CreditCard, RotateCcw } from 'lucide-react';
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

/** Города республиканского значения — выводятся первыми в списке регионов, без суффикса «область» (это не области). */
const REPUBLIC_CITIES = new Set(['Астана', 'Алматы', 'Шымкент']);

/** Города сверху, затем области — значение фильтра (region) не меняется, чтобы не разойтись с GeoJSON/фактовой таблицей, меняется только порядок и подпись в выпадающем списке. */
const ORDERED_REGION_OPTIONS: string[] = [
  'all',
  ...REGION_OPTIONS.filter((r) => r !== 'all' && REPUBLIC_CITIES.has(r)),
  ...REGION_OPTIONS.filter((r) => r !== 'all' && !REPUBLIC_CITIES.has(r)),
];

export function regionOptionLabel(r: string): string {
  if (r === 'all') return 'Все регионы';
  if (REPUBLIC_CITIES.has(r)) return r;
  return `${r} область`;
}

/**
 * `select.tsx` — общий примитив (переиспользуется и мобильным потребительским UI, где принят
 * пилюльный вид `rounded-full`). Здесь этот вид переопределяется через className только для
 * аналитического фильтра, под размер/радиус MUI `MuiDateField` (42px высота, 6px радиус) —
 * не трогая сам `select.tsx`, чтобы не задеть чипы фильтра в мобильной истории заправок
 * (`FilterBar.tsx`), которые используют тот же `SelectTrigger` (см. правки по стилям фильтра,
 * PROGRESS.md).
 */
const FILTER_TRIGGER_CLASS =
  'rounded-md border-navy-100 shadow-none px-4 py-2.5 data-[size=default]:h-[42px] hover:border-navy-200 focus-visible:border-orange-500';

/**
 * Единая строка глобальных фильтров дашборда (период/регион/марка/резидентство/тип держателя) —
 * по замечанию ПМ: должны влиять на все виджеты сразу, поэтому состояние фильтров живёт на
 * уровне `AdminDashboardPage` и прокидывается в вычисления `analyticsCompute.ts`.
 * Переиспользуется также как локальный мини-фильтр у отдельных виджетов (`fields` сужает набор).
 * Активные (не дефолтные) поля подсвечены оранжевым — чтобы было видно, что именно сейчас сужено.
 *
 * Поле периода использует MUI `DatePicker` (см. MuiDateField.tsx) — единственный MUI-элемент в
 * проекте. Раньше оно визуально выбивалось из ряда (свой плавающий лейбл, невидимый бордер,
 * pill-радиус) — теперь у него тот же паттерн «FieldLabel сверху + контрол снизу», что и у Select,
 * а подсветка активности — на самих полях, а не на обособленной обёртке (см. правки по стилям
 * фильтра, PROGRESS.md).
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
    <div className={cn('flex flex-wrap items-end gap-5', className)}>
      {fields.includes('date') && (
        <div className="space-y-1.5">
          <FieldLabel icon={CalendarDays}>Период</FieldLabel>
          <ThemeProvider theme={muiTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
              <div className="flex items-center gap-1.5">
                <MuiDateField value={filters.dateFrom} onChange={(v) => onChange({ dateFrom: v })} active={dateActive} placeholder="с" />
                <span className="text-xs text-navy-300">—</span>
                <MuiDateField value={filters.dateTo} onChange={(v) => onChange({ dateTo: v })} active={dateActive} placeholder="по" />
              </div>
            </LocalizationProvider>
          </ThemeProvider>
        </div>
      )}

      {fields.includes('region') && (
        <div className="space-y-1.5">
          <FieldLabel icon={MapPin}>Регион</FieldLabel>
          <Select value={filters.region} onValueChange={(v) => onChange({ region: v })}>
            <SelectTrigger aria-label="Регион" className={cn(FILTER_TRIGGER_CLASS, 'w-[180px]', regionActive && ACTIVE_TRIGGER_CLASS)}>
              <SelectValue placeholder="Все регионы" />
            </SelectTrigger>
            <SelectContent>
              {ORDERED_REGION_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {regionOptionLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {fields.includes('fuel') && (
        <div className="space-y-1.5">
          <FieldLabel icon={FuelIcon}>Марка топлива</FieldLabel>
          <Select value={filters.fuelType} onValueChange={(v) => onChange({ fuelType: v as DashboardFilters['fuelType'] })}>
            <SelectTrigger aria-label="Марка топлива" className={cn(FILTER_TRIGGER_CLASS, 'w-[158px]', fuelActive && ACTIVE_TRIGGER_CLASS)}>
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
        <div className="space-y-1.5">
          <FieldLabel icon={Users}>Резидентство</FieldLabel>
          <Select value={filters.residency} onValueChange={(v) => onChange({ residency: v as DashboardFilters['residency'] })}>
            <SelectTrigger aria-label="Резидентство" className={cn(FILTER_TRIGGER_CLASS, 'w-[148px]', residencyActive && ACTIVE_TRIGGER_CLASS)}>
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
        <div className="space-y-1.5">
          <FieldLabel icon={CreditCard}>Держатель</FieldLabel>
          <Select value={filters.ownerType} onValueChange={(v) => onChange({ ownerType: v as DashboardFilters['ownerType'] })}>
            <SelectTrigger aria-label="Тип держателя карты" className={cn(FILTER_TRIGGER_CLASS, 'w-[118px]', ownerActive && ACTIVE_TRIGGER_CLASS)}>
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