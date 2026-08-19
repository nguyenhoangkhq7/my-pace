"use client";

import type { GoalProgression } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { Target } from "lucide-react";

interface GoalProgressMiniProps {
  goal: GoalProgression;
}

export function GoalProgressMini({ goal }: GoalProgressMiniProps) {
  const { t } = useTranslation();
  const currentPct = Math.min(100, Math.max(0, goal.currentPct));
  const projectedPct = Math.min(100, Math.max(currentPct, goal.projectedPct));
  const deltaPct = projectedPct - currentPct;

  return (
    <div className="p-3 bg-muted/40 border border-border/80 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 min-w-0 font-medium text-foreground truncate">
          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate" title={goal.goalTitle}>
            {goal.goalTitle}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-semibold">
          <span className="text-muted-foreground">{currentPct}%</span>
          {deltaPct > 0 && (
            <>
              <span className="text-muted-foreground/60">→</span>
              <span className="text-emerald-400 font-bold">{projectedPct}%</span>
              <span className="text-[10px] text-emerald-400/80">(+{deltaPct}%)</span>
            </>
          )}
        </div>
      </div>

      <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden flex">
        <div
          className="bg-primary h-full transition-all duration-500 rounded-l-full"
          style={{ width: `${currentPct}%` }}
        />
        {deltaPct > 0 && (
          <div
            className="bg-emerald-400 h-full transition-all duration-500 opacity-80"
            style={{ width: `${deltaPct}%` }}
          />
        )}
      </div>

      {goal.daysRemaining >= 0 && (
        <div className="text-[10px] text-muted-foreground text-right">
          {t.briefing.remainingDays(goal.daysRemaining)}
        </div>
      )}
    </div>
  );
}
