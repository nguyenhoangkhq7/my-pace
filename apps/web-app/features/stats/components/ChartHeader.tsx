import { ReactNode } from "react";

interface ChartHeaderProps {
  title: string;
  icon: ReactNode;
}

export function ChartHeader({ title, icon }: ChartHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {icon}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );
}
