interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const mins = payload[0].value;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeStr = h > 0 ? `${h}h ${m}m (${mins} phút)` : `${mins} phút`;

    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
        <p className="text-foreground font-medium mb-1">{label}</p>
        <p className="text-indigo-400 text-sm font-bold">
          {timeStr}
        </p>
      </div>
    );
  }
  return null;
}
