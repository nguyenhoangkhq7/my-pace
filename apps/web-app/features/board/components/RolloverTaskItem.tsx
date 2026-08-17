"use client";

import { Task } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { Layers, CheckCircle2, ArrowRight, Undo2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RolloverTaskItemProps {
  task: Task;
  currentChoice: "today" | "backlog" | "done" | "delete";
  onChoiceChange: (choice: "today" | "backlog" | "done" | "delete") => void;
  isInProgress?: boolean;
}

function formatMinutes(minutes: number): string {
  const m = Math.max(0, minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h${min}p`;
  if (h > 0) return `${h}h`;
  return `${min}p`;
}

export function RolloverTaskItem({
  task,
  currentChoice,
  onChoiceChange,
  isInProgress,
}: RolloverTaskItemProps) {
  const { t } = useTranslation();

  const est = task.estimatedMinutes || 60;
  const act = task.actualMinutes || 0;
  const rem = Math.max(0, est - act);
  const progressPercent = Math.min(100, Math.round((act / est) * 100));

  return (
    <div
      className={cn(
        "p-3.5 bg-muted/40 border rounded-xl flex flex-col gap-2.5 transition-all",
        isInProgress ? "border-primary/20 bg-primary/[0.02]" : "border-border hover:border-border/80"
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate" title={task.title}>
              {task.title}
            </span>
            {task.isSplittable && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                <Layers className="w-3 h-3" />
                {task.maxDailyDuration
                  ? t.planning.maxPerDay(formatMinutes(task.maxDailyDuration))
                  : t.sunsamaForm.splittableBadge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.category && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                style={{
                  backgroundColor: `${task.category.color}15`,
                  color: task.category.color,
                  borderColor: `${task.category.color}30`,
                }}
              >
                {task.category.name}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {t.planning.estimatedPrefix} {formatMinutes(est)}
            </span>
          </div>
        </div>
      </div>

      {isInProgress && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium">
            <span>{t.outstanding.progressLabel(formatMinutes(act), formatMinutes(est), formatMinutes(rem))}</span>
            <span className="font-semibold text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action choices */}
      <div className={cn("grid gap-1.5 mt-1", isInProgress ? "grid-cols-3" : "grid-cols-3")}>
        {/* Move / Continue Today */}
        <button
          type="button"
          onClick={() => onChoiceChange("today")}
          className={cn(
            "py-1.5 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            currentChoice === "today"
              ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm"
              : "bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>{t.outstanding.moveToToday}</span>
        </button>

        {/* Backlog */}
        <button
          type="button"
          onClick={() => onChoiceChange("backlog")}
          className={cn(
            "py-1.5 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            currentChoice === "backlog"
              ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-500/40 shadow-sm"
              : "bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>{t.outstanding.moveToBacklog}</span>
        </button>

        {/* In progress has Done button, Unstarted has Delete button */}
        {isInProgress ? (
          <button
            type="button"
            onClick={() => onChoiceChange("done")}
            className={cn(
              "py-1.5 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              currentChoice === "done"
                ? "bg-purple-600/15 text-purple-600 dark:text-purple-400 border-purple-500/40 shadow-sm"
                : "bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.outstanding.markDone}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChoiceChange("delete")}
            className={cn(
              "py-1.5 px-2.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              currentChoice === "delete"
                ? "bg-red-600/15 text-red-600 dark:text-red-400 border-red-500/40 shadow-sm"
                : "bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.outstanding.delete}</span>
          </button>
        )}
      </div>
    </div>
  );
}
