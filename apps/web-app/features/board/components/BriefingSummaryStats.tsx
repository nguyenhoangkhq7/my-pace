"use client";

import type { DailyBriefingResponse } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefingSummaryStatsProps {
  briefing: DailyBriefingResponse;
  scheduledMinutesOverride?: number;
  taskCountOverride?: number;
}

function formatMinutes(minutes: number): string {
  const m = Math.max(0, minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
}

export function BriefingSummaryStats({ briefing, scheduledMinutesOverride, taskCountOverride }: BriefingSummaryStatsProps) {
  const { t } = useTranslation();

  const scheduledMinutes = scheduledMinutesOverride ?? briefing.scheduledMinutes;
  const taskCount = taskCountOverride ?? briefing.taskCount;
  const rawFillPct = briefing.availableMinutes > 0
    ? Math.round((scheduledMinutes * 100) / briefing.availableMinutes)
    : 0;
  const isOverloaded = rawFillPct > 100;

  return (
    <div className="space-y-2.5">
      {/* Snapshot row */}
      <div className="flex items-center gap-3 px-3.5 py-3 bg-muted/30 border border-border/60 rounded-xl text-sm">
        <Clock className="w-4 h-4 text-primary shrink-0" />

        {/* Free time — primary focus */}
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-foreground">
            {formatMinutes(briefing.availableMinutes)}
          </span>
          <span className="text-xs text-muted-foreground">{t.briefing.availableTime.toLowerCase()}</span>
        </div>

        <span className="text-border/80">·</span>

        {/* Workload */}
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-muted-foreground">
            {formatMinutes(scheduledMinutes)}
          </span>
          <span className="text-xs text-muted-foreground/70">{t.briefing.workloadTime.toLowerCase()}</span>
        </div>

        <span className="text-border/80">·</span>

        {/* Task count */}
        <span className="text-xs text-muted-foreground">
          {taskCount} {t.briefing.totalTasks.toLowerCase()}
        </span>

        {/* Overloaded indicator — only when > 100% */}
        {isOverloaded && (
          <>
            <span className="text-border/80">·</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 ml-auto">
              <AlertTriangle className="w-3.5 h-3.5" />
              {rawFillPct}%
            </span>
          </>
        )}
      </div>

      {/* Thin progress bar — only when overloaded */}
      {isOverloaded && (
        <div className="w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500 rounded-full", "bg-rose-500/70")}
            style={{ width: `${Math.min(100, Math.max(5, rawFillPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}

