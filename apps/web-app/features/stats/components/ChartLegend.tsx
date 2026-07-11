import { LegendItem } from "./LegendItem";

interface LegendData {
  name: string;
  color: string;
  value?: number;
}

interface ChartLegendProps {
  items: LegendData[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  const formatTime = (mins: number) => {
    if (mins === 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="flex flex-wrap gap-4 mt-6 justify-center">
      {items.map((entry, index) => {
        const displayName = entry.value !== undefined
          ? `${entry.name} (${formatTime(entry.value)})`
          : entry.name;
        return <LegendItem key={index} color={entry.color} name={displayName} />;
      })}
    </div>
  );
}
