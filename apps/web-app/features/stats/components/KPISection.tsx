import { Flame, TrendingUp } from "lucide-react";
import { KPICard } from "./KPICard";

interface KPISectionProps {
  completionRate?: number;
  streak?: number;
}

export function KPISection({ completionRate = 0, streak = 0 }: KPISectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-lg">
      <KPICard
        label="Hoàn thành"
        value={completionRate}
        unit="%"
        icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        iconBgClass="bg-emerald-500/10"
        unitColorClass="text-emerald-400"
      />

      <KPICard
        label="Chuỗi streak"
        value={streak}
        unit="ngày"
        icon={<Flame className="w-4 h-4 text-orange-400" />}
        iconBgClass="bg-orange-500/10"
        unitColorClass="text-orange-400"
      />
    </div>
  );
}

