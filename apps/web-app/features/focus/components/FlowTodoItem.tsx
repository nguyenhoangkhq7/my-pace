"use client";

import { memo } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { DailyPlanTask, TaskTimeBlock } from "@/features/board/types";

interface FlowTodoItemProps {
  task: DailyPlanTask;
  blocks?: TaskTimeBlock[];
  scheduleLabel: string | null;
  onTaskSelect?: (task: DailyPlanTask, block?: TaskTimeBlock) => void;
}

export const FlowTodoItem = memo(function FlowTodoItem({ task, blocks = [], scheduleLabel, onTaskSelect }: FlowTodoItemProps) {
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const activeTimeBlockInfo = useFocusStore((s) => s.activeTimeBlockInfo);
  const openFocusMode = useFocusStore((s) => s.openFocusMode);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);

  const isActive = task.task.id === activeTaskId;
  const isDone = task.task.status === "Done";

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDone) return;
    if (onTaskSelect) {
      onTaskSelect(task);
      return;
    }
    openFocusMode(task.task.id, task.id, task.task.estimatedMinutes || 25, task.task.actualMinutes || 0);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-3 rounded-xl border flex flex-col transition-all cursor-pointer group relative",
        isActive
          ? "bg-primary/5 border-primary shadow-md shadow-primary/10 ring-1 ring-primary/30 backdrop-blur-md z-10"
          : isVideoBackground
          ? "bg-card/80 backdrop-blur-md border-border/60 hover:border-primary/40 hover:bg-card/90"
          : "bg-card border-border hover:border-primary/40 hover:bg-muted",
        isDone ? "opacity-60 cursor-default hover:border-border hover:bg-card" : ""
      )}
    >
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-l-xl shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
      )}
      <div className="flex items-start space-x-3 w-full">
        <div className="mt-1 shrink-0">
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
            </div>
          ) : isActive ? (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/50 animate-pulse">
              <HugeiconsIcon icon={PlayIcon} size={12} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-border group-hover:border-primary flex items-center justify-center text-transparent group-hover:text-primary transition-colors">
              <HugeiconsIcon icon={PlayIcon} size={12} className="ml-0.5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <span className={cn(
              "font-semibold text-sm line-clamp-2 leading-tight transition-colors",
              isActive ? "text-primary" : "text-foreground",
              isDone ? "line-through text-muted-foreground" : ""
            )}>
              {task.task.title}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            {task.task.estimatedMinutes > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md border transition-colors",
                isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/50 border-border/50 text-secondary-foreground"
              )}>
                {task.task.estimatedMinutes}m
              </span>
            )}
            {task.task.category && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.task.category.color }}></span>
                <span className="truncate text-muted-foreground">
                  {task.task.category.name}
                </span>
              </div>
            )}
            {scheduleLabel && (
              <span className="ml-auto inline-flex items-center rounded-md border border-border/50 bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground shadow-sm">
                {scheduleLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Pills representing TaskTimeBlocks */}
      {blocks && blocks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-border/40 w-full">
          {blocks.map((b) => {
            const startStr = formatTime(b.startTime);
            const endStr = formatTime(b.endTime);
            const dur = Math.max(15, Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60)));
            const isBlockActive = isActive && activeTimeBlockInfo?.startTime === startStr;

            return (
              <button
                key={b.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDone) return;
                  if (onTaskSelect) {
                    onTaskSelect(task, b);
                  }
                }}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all border flex items-center space-x-1 cursor-pointer",
                  isBlockActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10 relative"
                    : "bg-secondary/60 hover:bg-secondary text-secondary-foreground border-border/40 hover:border-border/80"
                )}
                title={`Thực thi khối ${b.partIndex}/${b.totalParts} (${startStr} - ${endStr})`}
              >
                <span>🕒</span>
                <span>{startStr}-{endStr}</span>
                <span className={cn("opacity-75", isBlockActive ? "text-primary-foreground/80" : "")}>({dur}m)</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

