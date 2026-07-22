export interface KpiTileProps {
  label: string;
  value: string;
  sublabel?: string;
}

/** KPI-плашка — крупная цифра и подпись (ТЗ 8.5, A-01). Акцентный оранжевый — «важные показатели». */
export function KpiTile({ label, value, sublabel }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
      <p className="text-3xl font-bold text-orange-600">{value}</p>
      <p className="mt-1 text-sm font-medium text-navy-700">{label}</p>
      {sublabel && <p className="text-xs text-navy-400">{sublabel}</p>}
    </div>
  );
}
