"use client";

import { useBoardStore } from "@/features/board/store/board.store";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";
import type { DailyPlanTask } from "@/features/board/types";
import { FlowTodoItem } from "./FlowTodoItem";

interface FlowTodoListProps {
  onTaskSelect?: (task: DailyPlanTask) => void;
}

export function FlowTodoList({ onTaskSelect }: FlowTodoListProps) {
  const { dailyPlanToday, timeBlocks } = useBoardStore();
  const { pomodoroState } = useFocusStore();

  const isFocusing = pomodoroState === "focusing";

  if (!dailyPlanToday || !dailyPlanToday.tasks || dailyPlanToday.tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground border-r border-border bg-background">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 shadow-inner">
          <span className="text-xl">📝</span>
        </div>
        <p className="text-sm font-medium">Chưa có công việc nào cho hôm nay.</p>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const getTaskBlocks = (taskId: string) => {
    return timeBlocks
      .filter((block) => block.taskId === taskId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const getTaskScheduleLabel = (taskId: string) => {
    const blocks = getTaskBlocks(taskId);

    if (blocks.length === 0) {
      return null;
    }

    if (blocks.length === 1) {
      return `${formatTime(blocks[0].startTime)} - ${formatTime(blocks[0].endTime)}`;
    }

    const firstStart = formatTime(blocks[0].startTime);
    const lastEnd = formatTime(blocks[blocks.length - 1].endTime);
    return `${firstStart} - ${lastEnd} · ${blocks.length} parts`;
  };

  const getTaskOrderKey = (task: DailyPlanTask) => {
    const blocks = getTaskBlocks(task.task.id);
    const firstBlockStart = blocks[0]?.startTime;

    return {
      hasSchedule: blocks.length > 0,
      startTime: firstBlockStart ? new Date(firstBlockStart).getTime() : Number.POSITIVE_INFINITY,
      sortOrder: task.sortOrder,
      isMit: task.isMit,
    };
  };

  const orderedTasks = [...dailyPlanToday.tasks].sort((a, b) => {
    const aKey = getTaskOrderKey(a);
    const bKey = getTaskOrderKey(b);

    if (aKey.hasSchedule !== bKey.hasSchedule) {
      return aKey.hasSchedule ? -1 : 1;
    }

    if (aKey.startTime !== bKey.startTime) {
      return aKey.startTime - bKey.startTime;
    }

    if (aKey.isMit !== bKey.isMit) {
      return aKey.isMit ? -1 : 1;
    }

    return aKey.sortOrder - bKey.sortOrder;
  });

  return (
    <div
      className={cn(
        "h-full flex flex-col border-r border-border bg-background transition-opacity duration-700",
        isFocusing ? "opacity-30 hover:opacity-100" : "opacity-100"
      )}
    >
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground tracking-wide flex items-center">
            Flow
            <span className="relative flex h-2 w-2 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">
            Today: {dailyPlanToday.tasks.length} tasks
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {orderedTasks.map((pt) => (
          <FlowTodoItem
            key={pt.id}
            task={pt}
            scheduleLabel={getTaskScheduleLabel(pt.task.id)}
            onTaskSelect={onTaskSelect}
          />
        ))}
      </div>
    </div>
  );
}
