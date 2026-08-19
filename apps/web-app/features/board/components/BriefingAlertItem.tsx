"use client";

import type { BriefingAlert } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { AlertTriangle, AlertCircle, Clock, TrendingDown, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefingAlertItemProps {
  alert: BriefingAlert;
}

export function BriefingAlertItem({ alert }: BriefingAlertItemProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (alert.type) {
      case "OVERDUE":
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case "DUE_TODAY":
        return <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case "GOAL_BEHIND":
        return <TrendingDown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case "OVERLOADED":
        return <Gauge className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      default:
        return <AlertCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;
    }
  };

  const getMessage = () => {
    switch (alert.type) {
      case "OVERDUE":
        return t.briefing.overdueWarning(alert.count);
      case "DUE_TODAY":
        return t.briefing.dueTodayWarning(alert.count);
      case "GOAL_BEHIND":
        return t.briefing.goalBehindWarning(alert.goalTitle || "", alert.count);
      case "OVERLOADED": {
        const h = Math.floor(alert.count / 60);
        const m = alert.count % 60;
        const overflowStr = h > 0 ? (m > 0 ? `${h}h${m}m` : `${h}h`) : `${m}m`;
        return t.briefing.overloadedWarning(overflowStr);
      }
      default:
        return alert.message;
    }
  };

  const isCritical = alert.severity === "critical";

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs leading-relaxed border transition-colors",
        isCritical
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300 dark:text-rose-200"
          : "bg-amber-500/10 border-amber-500/30 text-amber-300 dark:text-amber-200"
      )}
    >
      {getIcon()}
      <span className="flex-1 font-medium">{getMessage()}</span>
    </div>
  );
}
