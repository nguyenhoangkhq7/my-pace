import { LegendItem } from "./LegendItem";

interface LegendData {
  name: string;
  color: string;
}

interface ChartLegendProps {
  items: LegendData[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="flex flex-wrap gap-4 mt-6 justify-center">
      {items.map((entry, index) => (
        <LegendItem key={index} color={entry.color} name={entry.name} />
      ))}
    </div>
  );
}
