import { Flame, TrendingUp, Target, Clock } from "lucide-react";
import { KPICard } from "./KPICard";

import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      <KPICard
        label={t.stats.kpiCompletion}
        value={completionRate}
        unit="%"
        icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        iconBgClass="bg-emerald-500/10"
        unitColorClass="text-emerald-400"
      />

      <KPICard
        label={t.stats.kpiStreak}
        value={streak}
        unit={t.stats.unitDays}
        icon={<Flame className="w-4 h-4 text-orange-400" />}
        iconBgClass="bg-orange-500/10"
        unitColorClass="text-orange-400"
      />

      <KPICard
        label={t.stats.kpiQ2Focus}
        value={q2FocusRatio}
        unit="%"
        icon={<Target className="w-4 h-4 text-indigo-400" />}
        iconBgClass="bg-indigo-500/10"
        unitColorClass="text-indigo-400"
      />

      <KPICard
        label={t.stats.kpiAccuracy}
        value={estimationAccuracy}
        unit="%"
        icon={<Clock className="w-4 h-4 text-sky-400" />}
        iconBgClass="bg-sky-500/10"
        unitColorClass="text-sky-400"
      />
    </div>
  );
}


