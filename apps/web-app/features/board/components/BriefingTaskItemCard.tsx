"use client";

import type { BriefingTaskItem } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { Clock, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefingTaskItemProps {
  task: BriefingTaskItem;
  currentDate?: string;
  onRemove?: (taskId: string) => void;
  dimmed?: boolean;
}

function formatMinutes(minutes: number): string {
  const m = Math.max(0, minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
}

function getDueStatus(dueDateStr?: string | null, currentDateStr?: string) {
  if (!dueDateStr) return null;
  const taskDate = dueDateStr.split("T")[0];
  const today = currentDateStr
    ? currentDateStr.split("T")[0]
    : new Date().toISOString().split("T")[0];
  if (taskDate < today) return "OVERDUE";
  if (taskDate === today) return "DUE_TODAY";
  return null;
}

function QuadrantBadge({ isUrgent, isImportant }: { isUrgent: boolean; isImportant: boolean }) {
  if (isUrgent && isImportant)
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
        Q1
      </span>
    );
  if (!isUrgent && isImportant)
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 shrink-0">
        Q2
      </span>
    );
  if (isUrgent && !isImportant)
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
        Q3
      </span>
    );
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/25 shrink-0">
      Q4
    </span>
  );
}

export function BriefingTaskItemCard({ task, currentDate, onRemove, dimmed }: BriefingTaskItemProps) {
  const { t } = useTranslation();
  const dueStatus = getDueStatus(task.dueDate, currentDate);
  const isOverdue = dueStatus === "OVERDUE";
  const isDueToday = dueStatus === "DUE_TODAY";
  const isPartial =
    task.totalEstimatedMinutes && task.totalEstimatedMinutes > task.estimatedMinutes;

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-2.5 py-2.5 pl-3 pr-2 rounded-xl border text-xs transition-all bg-muted/20 border-border/60 hover:border-border/90",
        "border-l-[3px]",
        isOverdue
          ? "border-l-rose-500"
          : isDueToday
          ? "border-l-amber-400"
          : "border-l-transparent",
        dimmed && "opacity-50 hover:opacity-75"
      )}
    >
      {/* Left: quadrant + title + MIT star */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <QuadrantBadge isUrgent={task.isUrgent} isImportant={task.isImportant} />

        <span className="font-medium text-foreground truncate" title={task.title}>
          {task.title}
        </span>

        {task.isMit && (
          <span title="Most Important Task" className="shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          </span>
        )}
      </div>

      {/* Right: category + time + remove button */}
      <div className="flex items-center gap-2 shrink-0">
        {task.categoryName && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
            style={{
              backgroundColor: task.categoryColor ? `${task.categoryColor}15` : undefined,
              color: task.categoryColor || undefined,
              borderColor: task.categoryColor ? `${task.categoryColor}30` : undefined,
            }}
          >
            {task.categoryName}
          </span>
        )}

        <span
          className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"
          title={
            isPartial
              ? `${t.briefing.workloadTime}: ${formatMinutes(task.estimatedMinutes)} / ${formatMinutes(task.totalEstimatedMinutes || 0)}`
              : undefined
          }
        >
          <Clock className="w-3 h-3" />
          <span>{formatMinutes(task.estimatedMinutes)}</span>
          {isPartial && (
            <span className="text-[10px] text-muted-foreground/60 font-normal">
              /{formatMinutes(task.totalEstimatedMinutes || 0)}
            </span>
          )}
        </span>

        {/* Remove button — visible on hover only */}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted-foreground/15 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
            title="Bỏ khỏi kế hoạch hôm nay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
