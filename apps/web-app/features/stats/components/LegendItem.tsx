interface LegendItemProps {
  color: string;
  name: string;
}

export function LegendItem({ color, name }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{name}</span>
    </div>
  );
}
