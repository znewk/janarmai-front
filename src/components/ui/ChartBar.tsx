import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ChartBarSeries<T> {
  key: keyof T & string;
  label: string;
  color: string;
}

export interface ChartBarProps<T extends object> {
  data: T[];
  xKey: keyof T & string;
  series: ChartBarSeries<T>[];
  height?: number;
}

/** Обёртка над Recharts BarChart с фирменной палитрой — рейтинг сетей АЗС (A-03, тех.план раздел 6). */
export function ChartBar<T extends object>({ data, xKey, series, height = 260 }: ChartBarProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid stroke="#e5e9f0" strokeDasharray="0" vertical={false} />
        <XAxis dataKey={xKey as never} tick={{ fontSize: 12, fill: '#5b6b85' }} axisLine={{ stroke: '#e5e9f0' }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#5b6b85' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d6e0ef' }} cursor={{ fill: '#f3f6fb' }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key as never} name={s.label} fill={s.color} maxBarSize={24} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
