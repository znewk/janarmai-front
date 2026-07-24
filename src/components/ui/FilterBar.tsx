import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface FilterDef {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** Панель фильтров (история заправок, очередь кейсов) — период, карта/ТС/регион, АЗС/тип, статус (тех.план раздел 6). */
export function FilterBar({ filters }: { filters: FilterDef[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger aria-label={filter.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
