"use client";

import { memo } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { DailyPlanTask, TaskTimeBlock } from "@/features/board/types";


interface FlowTimeBlockItemProps {
  block: TaskTimeBlock;
  planTask: DailyPlanTask;
  onSelect?: (planTask: DailyPlanTask, timeBlock: TaskTimeBlock) => void;
}

export const FlowTimeBlockItem = memo(function FlowTimeBlockItem({ block, planTask, onSelect }: FlowTimeBlockItemProps) {
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const openFocusMode = useFocusStore((s) => s.openFocusMode);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);

  const isActive = planTask.task.id === activeTaskId;
  const isDone = planTask.task.status === "Done";

  const startTimeStr = new Date(block.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = new Date(block.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  const blockDuration = Math.max(15, Math.round((new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / (1000 * 60)));

  const handleClick = () => {
    if (isDone) return;
    if (onSelect) {
      onSelect(planTask, block);
      return;
    }
    openFocusMode(planTask.task.id, planTask.id, blockDuration, planTask.task.actualMinutes || 0);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer group",
        isActive
          ? "bg-card/90 border-indigo-500/55 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          : isVideoBackground
          ? "bg-card/60 backdrop-blur-xs border-border/60 hover:border-indigo-500/30 hover:bg-card/80"
          : "bg-card border-border hover:border-indigo-500/30 hover:bg-muted",
        isDone ? "opacity-40 grayscale cursor-default hover:border-border hover:bg-card" : ""
      )}
    >
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
        <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold mb-0.5">
          <span>{startTimeStr} - {endTimeStr}</span>
          <div className="flex items-center space-x-1.5">

            {block.totalParts > 1 && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                Part {block.partIndex}/{block.totalParts}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "text-sm font-medium truncate tracking-wide",
            isDone ? "text-muted-foreground line-through" : isActive ? "text-indigo-300" : "text-foreground"
          )}
        >
          {planTask.task.title}
        </div>

        <div className="flex items-center mt-1.5 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-wrap">
          <span className="bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            {blockDuration}m {planTask.task.actualMinutes ? `(${planTask.task.actualMinutes}m done)` : ""}
          </span>
          {planTask.task.category && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: planTask.task.category.color }}></span>
              <span className="truncate text-muted-foreground">
                {planTask.task.category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
