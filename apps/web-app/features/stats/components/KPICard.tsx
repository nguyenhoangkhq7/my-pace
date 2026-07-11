import { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: ReactNode;
  iconBgClass?: string;
  unitColorClass?: string;
}

export function KPICard({
  label,
  value,
  unit,
  icon,
  iconBgClass = "bg-emerald-500/10",
  unitColorClass = "text-emerald-400",
}: KPICardProps) {
  return (
    <div className="bg-card rounded-xl p-3.5 border border-border shadow-md relative overflow-hidden group flex items-center gap-3">
      <div className={`${iconBgClass} p-2 rounded-lg shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-bold text-foreground">{value}</span>
          <span className={`text-xs font-semibold ${unitColorClass}`}>{unit}</span>
        </div>
      </div>
    </div>
  );
}
