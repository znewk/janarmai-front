export interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}

/** Мини-тренд за период — тонкая линия (2px), без осей/тултипа (сам факт формы важнее точных значений). */
export function Sparkline({ data, color, height = 32, width = 104 }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <polyline points={areaPoints} fill={color} fillOpacity={0.1} stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
