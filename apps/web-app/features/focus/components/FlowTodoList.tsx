"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { useTranslation } from "@/hooks/use-translation";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import type { DailyPlanTask, TaskTimeBlock, DailyPlan } from "@/features/board/types";
import { useTaskTimeBlocks } from "@/features/board/hooks/useTaskTimeBlocks";
import { FlowTodoItem } from "./FlowTodoItem";

interface FlowTodoListProps {
  onTaskSelect?: (task: DailyPlanTask, block?: TaskTimeBlock) => void;
}

export function FlowTodoList({ onTaskSelect }: FlowTodoListProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', todayStr], queryFn: () => fetchClient.get<DailyPlan>(`daily-plans/${todayStr}`).then((r) => r.data) });
  const { data: timeBlocks = [] } = useTaskTimeBlocks(todayStr, todayStr);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);

  const isFocusing = pomodoroState === "focusing";

  const { orderedTasks, scheduleLabelsMap, taskBlocksMap } = useMemo(() => {
    const tasks = dailyPlanToday?.tasks;
    const blocks = timeBlocks;
    if (!tasks) return { orderedTasks: [], scheduleLabelsMap: new Map<string, string | null>(), taskBlocksMap: new Map<string, TaskTimeBlock[]>() };

    const formatTime = (iso: string) => {
      const date = new Date(iso);
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    };

    const taskBlocksMap = new Map<string, TaskTimeBlock[]>();
    blocks.forEach((block: TaskTimeBlock) => {
      const existing = taskBlocksMap.get(block.taskId) ?? [];
      existing.push(block);
      taskBlocksMap.set(block.taskId, existing);
    });

    taskBlocksMap.forEach((bList) => {
      bList.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    const labelsMap = new Map<string, string | null>();
    tasks.forEach((pt) => {
      const bList = taskBlocksMap.get(pt.task.id) ?? [];
      if (bList.length === 0) {
        labelsMap.set(pt.task.id, null);
      } else if (bList.length === 1) {
        labelsMap.set(pt.task.id, `${formatTime(bList[0].startTime)} - ${formatTime(bList[0].endTime)}`);
      } else {
        labelsMap.set(pt.task.id, `${formatTime(bList[0].startTime)} - ${formatTime(bList[bList.length - 1].endTime)} · ${bList.length} parts`);
      }
    });

    const getOrderKey = (task: DailyPlanTask) => {
      const bList = taskBlocksMap.get(task.task.id) ?? [];
      return {
        hasSchedule: bList.length > 0,
        startTime: bList[0]?.startTime ? new Date(bList[0].startTime).getTime() : Number.POSITIVE_INFINITY,
        sortOrder: task.sortOrder,
        isMit: task.isMit,
      };
    };

    const sortedTasks = [...tasks].sort((a, b) => {
      const aKey = getOrderKey(a);
      const bKey = getOrderKey(b);
      if (aKey.hasSchedule !== bKey.hasSchedule) return aKey.hasSchedule ? -1 : 1;
      if (aKey.startTime !== bKey.startTime) return aKey.startTime - bKey.startTime;
      if (aKey.isMit !== bKey.isMit) return aKey.isMit ? -1 : 1;
      return aKey.sortOrder - bKey.sortOrder;
    });

    return { orderedTasks: sortedTasks, scheduleLabelsMap: labelsMap, taskBlocksMap };
  }, [dailyPlanToday, timeBlocks]);

  if (!dailyPlanToday || !dailyPlanToday.tasks || dailyPlanToday.tasks.length === 0) {
    return (
      <div className={cn(
        "h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground border-r border-border transition-colors duration-300",
        isVideoBackground ? "bg-background/40 backdrop-blur-md" : "bg-background"
      )}>
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 shadow-inner">
          <span className="text-xl">📝</span>
        </div>
        <p className="text-sm font-medium">Chưa có công việc nào cho hôm nay.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full flex flex-col border-r border-border/40 transition-all duration-300 min-w-[220px]",
        isVideoBackground ? "bg-background/40 backdrop-blur-md" : "bg-background",
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
            {t.flow.todayTasksCount(dailyPlanToday.tasks.length)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {orderedTasks.map((pt) => (
          <FlowTodoItem
            key={pt.id}
            task={pt}
            blocks={taskBlocksMap.get(pt.task.id)}
            scheduleLabel={scheduleLabelsMap.get(pt.task.id) ?? null}
            onTaskSelect={onTaskSelect}
          />
        ))}
      </div>
    </div>
  );
}
