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
        "p-3 rounded-xl border flex flex-col transition-all cursor-pointer group",
        isActive
          ? "bg-card/90 border-indigo-500/55 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          : isVideoBackground
          ? "bg-card/60 backdrop-blur-xs border-border/60 hover:border-indigo-500/30 hover:bg-card/80"
          : "bg-card border-border hover:border-indigo-500/30 hover:bg-muted",
        isDone ? "opacity-40 grayscale cursor-default hover:border-border hover:bg-card" : ""
      )}
    >
      <div className="flex items-start space-x-3 w-full">
        <div className="mt-1 shrink-0">
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
            </div>
          ) : isActive ? (
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]">
              <HugeiconsIcon icon={PlayIcon} size={12} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-border group-hover:border-indigo-400 flex items-center justify-center text-transparent group-hover:text-indigo-400 transition-colors">
              <HugeiconsIcon icon={PlayIcon} size={12} className="ml-0.5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-sm font-medium truncate tracking-wide",
              isDone ? "text-muted-foreground line-through" : isActive ? "text-indigo-300 font-semibold" : "text-foreground"
            )}
          >
            {task.task.title}
          </div>
          <div className="flex items-center mt-1.5 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-wrap">
            {task.task.estimatedMinutes > 0 && (
              <span className="bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">
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
              <span className="ml-auto inline-flex items-center rounded-full border border-background/20 bg-foreground px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-background shadow-[0_4px_12px_rgba(0,0,0,0.14)]">
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
                  "px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border flex items-center space-x-1 cursor-pointer",
                  isBlockActive
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-xs"
                    : "bg-muted/80 hover:bg-indigo-500/15 hover:text-indigo-400 hover:border-indigo-500/40 text-muted-foreground border-border/60"
                )}
                title={`Thực thi khối ${b.partIndex}/${b.totalParts} (${startStr} - ${endStr})`}
              >
                <span>🕒</span>
                <span>{startStr}-{endStr}</span>
                <span className="opacity-75">({dur}m)</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

