import { useBoardStore } from "@/features/board/store/board.store";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { DailyPlanTask } from "@/features/board/types";

interface FlowTodoListProps {
  onTaskSelect?: (task: DailyPlanTask) => void;
}

export function FlowTodoList({ onTaskSelect }: FlowTodoListProps) {
  const { dailyPlanToday, timeBlocks } = useBoardStore();
  const { activeTaskId, pomodoroState, openFocusMode } = useFocusStore();

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

  const renderTask = (pt: DailyPlanTask) => {
    const isActive = pt.task.id === activeTaskId;
    const isDone = pt.task.status === "Done";
    const scheduleLabel = getTaskScheduleLabel(pt.task.id);

    return (
      <div 
        key={pt.id} 
        onClick={() => {
          if (isDone) return;
          if (onTaskSelect) {
            onTaskSelect(pt);
            return;
          }
          openFocusMode(pt.task.id, pt.id, pt.task.estimatedMinutes || 25);
        }}
        className={cn(
          "p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer group",
          isActive 
            ? "bg-card border-indigo-500/55 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
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
          <div className={cn(
            "text-sm font-medium truncate tracking-wide",
            isDone ? "text-muted-foreground line-through" : isActive ? "text-indigo-300" : "text-foreground"
          )}>
            {pt.task.title}
          </div>
          <div className="flex items-center mt-1.5 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-wrap">
            {pt.task.estimatedMinutes > 0 && (
              <span className="bg-background px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                {pt.task.estimatedMinutes}m
              </span>
            )}
            {pt.task.category && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pt.task.category.color }}></span>
                <span className="truncate text-muted-foreground">
                  {pt.task.category.name}
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
    );
  };

  return (
    <div className={cn(
      "h-full flex flex-col border-r border-border bg-background transition-opacity duration-700",
      isFocusing ? "opacity-30 hover:opacity-100" : "opacity-100"
    )}>
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
        {orderedTasks.map(renderTask)}
      </div>
    </div>
  );
}
