export interface FilterDef {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** Панель фильтров истории заправок — период, карта/ТС, АЗС, вид топлива (тех.план раздел 6). */
export function FilterBar({ filters }: { filters: FilterDef[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm shadow-gray-200/60"
          aria-label={filter.label}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
