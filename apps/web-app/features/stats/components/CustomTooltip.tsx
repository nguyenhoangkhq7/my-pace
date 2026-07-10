interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
        <p className="text-foreground font-medium mb-1">{label}</p>
        <p className="text-primary text-sm font-bold">
          {payload[0].value} phút
        </p>
      </div>
    );
  }
  return null;
}
