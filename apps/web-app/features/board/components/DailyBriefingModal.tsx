"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useDailyBriefing } from "../hooks/useDailyBriefing";
import { BriefingSummaryStats } from "./BriefingSummaryStats";
import { BriefingTaskList } from "./BriefingTaskList";
import { GoalProgressMini } from "./GoalProgressMini";
import { ArrowRight, Sparkles } from "lucide-react";
import type { BriefingTaskItem } from "../types";

interface DailyBriefingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: string;
  onUseThisPlan: (tasks: BriefingTaskItem[]) => void;
}

export function DailyBriefingModal({
  isOpen,
  onOpenChange,
  currentDate,
  onUseThisPlan,
}: DailyBriefingModalProps) {
  const { t, locale } = useTranslation();
  const { briefing } = useDailyBriefing(currentDate, isOpen);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reset local removals whenever modal is opened
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setRemovedIds(new Set());
    }
  }

  const handleRemove = useCallback((taskId: string) => {
    setRemovedIds((prev) => new Set(prev).add(taskId));
  }, []);

  if (!briefing) return null;

  const allTasks = briefing.tasks ?? [];
  const visibleTasks = allTasks.filter((t) => !removedIds.has(t.id));

  // Dynamic greedy fit based on available minutes and remaining visible tasks
  const fitTasks: BriefingTaskItem[] = [];
  const overflowTasks: BriefingTaskItem[] = [];
  let budget = briefing.availableMinutes;

  for (const t of visibleTasks) {
    if (budget >= t.estimatedMinutes) {
      fitTasks.push({ ...t, fitsToday: true });
      budget -= t.estimatedMinutes;
    } else {
      overflowTasks.push({ ...t, fitsToday: false });
    }
  }

  // Stats only reflect what realistically fits today
  const effectiveScheduledMinutes = fitTasks.reduce(
    (sum, t) => sum + t.estimatedMinutes,
    0
  );

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? t.briefing.morningGreeting
      : currentHour < 18
      ? t.briefing.afternoonGreeting
      : t.briefing.eveningGreeting;

  const formattedDate = (() => {
    try {
      const d = new Date(currentDate);
      return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    } catch {
      return currentDate;
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border sm:max-w-[580px] max-h-[88vh] flex flex-col p-6 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
              ☀️
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold text-foreground truncate">
                {greeting}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-0.5 capitalize">
                {formattedDate}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4 scrollbar-thin">
          {/* Section 1: Compact snapshot — updates real-time as tasks are removed */}
          <BriefingSummaryStats
            briefing={briefing}
            scheduledMinutesOverride={effectiveScheduledMinutes}
            taskCountOverride={fitTasks.length}
          />

          {/* Section 2: Tasks that fit today */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span>{t.briefing.suggestedTasksTitle}</span>
              {fitTasks.length > 0 && (
                <>
                  <span className="text-border/60">·</span>
                  <span>{fitTasks.length}</span>
                </>
              )}
            </div>

            {fitTasks.length > 0 ? (
              <BriefingTaskList
                tasks={fitTasks}
                currentDate={currentDate}
                onRemove={handleRemove}
              />
            ) : (
              <p className="text-xs text-muted-foreground/60 text-center py-3">
                Không còn việc nào — nhẹ nhàng rồi! 🎉
              </p>
            )}
          </div>

          {/* Section 3: Overflow tasks — don't fit in available time */}
          {overflowTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[11px] text-muted-foreground/60 shrink-0">
                  Không đủ thời gian · {overflowTasks.length} việc
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <BriefingTaskList
                tasks={overflowTasks}
                currentDate={currentDate}
                onRemove={handleRemove}
                dimmed
              />
            </div>
          )}

          {/* Section 3: Goal Progressions (if any) */}
          {briefing.goalProgressions && briefing.goalProgressions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {t.briefing.goalProgressTitle}
              </div>
              <div className="space-y-2">
                {briefing.goalProgressions.map((goal) => (
                  <GoalProgressMini key={goal.goalId} goal={goal} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="mt-4 border-t border-border pt-4 shrink-0 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-9 rounded-xl px-3.5"
          >
            {t.briefing.remindLater || "Để sau"}
          </Button>

          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-5 rounded-xl text-xs cursor-pointer shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
            onClick={() => onUseThisPlan(fitTasks)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.briefing.useThisPlan}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
