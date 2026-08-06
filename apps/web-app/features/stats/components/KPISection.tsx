import { Flame, TrendingUp, Target, Clock } from "lucide-react";
import { KPICard } from "./KPICard";

interface KPISectionProps {
  completionRate?: number;
  streak?: number;
  q2FocusRatio?: number;
  estimationAccuracy?: number;
}

export function KPISection({
  completionRate = 0,
  streak = 0,
  q2FocusRatio = 0,
  estimationAccuracy = 0,
}: KPISectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
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

      <KPICard
        label="Tập trung Q2"
        value={q2FocusRatio}
        unit="%"
        icon={<Target className="w-4 h-4 text-indigo-400" />}
        iconBgClass="bg-indigo-500/10"
        unitColorClass="text-indigo-400"
      />

      <KPICard
        label="Chuẩn Kế Hoạch"
        value={estimationAccuracy}
        unit="%"
        icon={<Clock className="w-4 h-4 text-sky-400" />}
        iconBgClass="bg-sky-500/10"
        unitColorClass="text-sky-400"
      />
    </div>
  );
}


