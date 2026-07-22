import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ChartLineSeries<T> {
  key: keyof T & string;
  label: string;
  color: string;
}

export interface ChartLineProps<T extends object> {
  data: T[];
  xKey: keyof T & string;
  series: ChartLineSeries<T>[];
  height?: number;
}

/** Обёртка над Recharts LineChart с фирменной палитрой — сверка по месяцам (A-02, тех.план раздел 6). */
export function ChartLine<T extends object>({ data, xKey, series, height = 260 }: ChartLineProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#e5e9f0" strokeDasharray="0" vertical={false} />
        <XAxis dataKey={xKey as never} tick={{ fontSize: 12, fill: '#5b6b85' }} axisLine={{ stroke: '#e5e9f0' }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#5b6b85' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d6e0ef' }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key as never} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
