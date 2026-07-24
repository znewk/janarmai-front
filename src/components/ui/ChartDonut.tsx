import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface ChartDonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface ChartDonutProps {
  data: ChartDonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
}

/** Донат-диаграмма — структура потребления (A-05, тех.план раздел 6). */
export function ChartDonut({ data, centerLabel, centerValue, height = 240 }: ChartDonutProps) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="98%" paddingAngle={2} stroke="none">
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d6e0ef' }} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-900">{centerValue}</p>
          {centerLabel && <p className="text-xs text-navy-400">{centerLabel}</p>}
        </div>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
        {data.map((slice) => (
          <span key={slice.name} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
            {slice.name}
          </span>
        ))}
      </div>
    </div>
  );
}
