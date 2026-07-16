"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Draggable } from "@fullcalendar/interaction";
import { DailyPlanTask, DailyPlan } from "@/features/board/types";
import { UnscheduledTaskItem } from "./UnscheduledTaskItem";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface CalendarSidebarProps {
  unscheduledTasks: DailyPlanTask[];
  isAutoScheduling: boolean;
  onAutoSchedule: () => void;
  dailyPlanLength: number;
  timeBlocksLength: number;
  isSidebarOpen: boolean;
  dailyPlanToday?: DailyPlan | null;
  onConfirmPlan?: () => void;
  isConfirming?: boolean;
}

export const CalendarSidebar = forwardRef<HTMLDivElement, CalendarSidebarProps>(
  ({ 
    unscheduledTasks, 
    isAutoScheduling, 
    onAutoSchedule, 
    dailyPlanLength, 
    timeBlocksLength, 
    isSidebarOpen, 
    dailyPlanToday,
    onConfirmPlan,
    isConfirming 
  }, ref) => {
    const { t } = useTranslation();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const draggableRef = useRef<Draggable | null>(null);

    useImperativeHandle(ref, () => sidebarRef.current as HTMLDivElement);

    const TASK_COLOR_MIT  = "#6366f1";
    const TASK_COLOR_REG  = "#475569";

    useEffect(() => {
      if (!sidebarRef.current) return;
      draggableRef.current?.destroy();

      draggableRef.current = new Draggable(sidebarRef.current, {
        itemSelector: "[data-task-id]",
        eventData: (el) => {
          const taskId   = el.getAttribute("data-task-id") || "";
          const minutes  = parseInt(el.getAttribute("data-duration") || "60", 10);
          const title    = el.getAttribute("data-title") || "";
          const isMit    = el.getAttribute("data-mit") === "true";
          const catColor = el.getAttribute("data-color") || "";
          const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
          const mm = String(minutes % 60).padStart(2, "0");
          const color = catColor || (isMit ? TASK_COLOR_MIT : TASK_COLOR_REG);
          return {
            id: `drag-${taskId}`,
            title,
            duration: `${hh}:${mm}:00`,
            backgroundColor: color,
            borderColor: color,
            textColor: "#ffffff",
            extendedProps: { taskId, isTimeBlock: true, isMit },
          };
        },
      });
      return () => draggableRef.current?.destroy();
    }, [dailyPlanLength, timeBlocksLength, isSidebarOpen]);

    const hasPlan = !!(dailyPlanToday && dailyPlanToday.tasks && dailyPlanToday.tasks.length > 0);

    if (!hasPlan) {
      return (
        <div className="w-56 flex-shrink-0 flex flex-col rounded-2xl border border-border bg-card overflow-hidden p-4 text-center justify-center items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <HugeiconsIcon icon={Clock01Icon} size={20} />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold" style={{ color: 'var(--card-foreground)' }}>{t.calendar.notPlanned}</div>
            <div className="text-[10px] text-muted-foreground leading-normal">
              {t.calendar.notPlannedDesc}
            </div>
          </div>
          <Button
            size="sm"
            className="w-full text-[11px] py-1.5 h-auto font-semibold rounded-lg shadow-md cursor-pointer"
            onClick={() => window.location.href = "/"}
          >
            {t.calendar.planNow}
          </Button>
        </div>
      );
    }

    return (
      <div className="w-56 flex-shrink-0 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
          <div>
            <div className="text-xs font-bold text-card-foreground uppercase tracking-wider">{t.calendar.todoToday}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{t.calendar.dragToSchedule}</div>
          </div>
          <Button
            size="sm"
            onClick={onAutoSchedule}
            disabled={isAutoScheduling}
            className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary text-[11px] py-1 h-auto font-semibold rounded-lg cursor-pointer"
          >
            {isAutoScheduling ? t.calendar.autoScheduling : t.calendar.autoSchedule}
          </Button>
        </div>

        <div ref={sidebarRef} className="flex-1 overflow-y-auto p-2.5 space-y-1.5 flex flex-col justify-between h-full">
          <div className="space-y-1.5 flex flex-col">
            {unscheduledTasks
              .slice()
              .sort((a, b) => (a.isMit === b.isMit ? 0 : a.isMit ? -1 : 1))
              .map((pt) => (
                <UnscheduledTaskItem key={pt.task.id} pt={pt} />
              ))}
          </div>

          {dailyPlanToday && !dailyPlanToday.isConfirmed && unscheduledTasks.length === 0 && (
            <div className="pt-4 mt-auto flex flex-col items-center gap-3 text-center p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <div className="text-[10px] text-muted-foreground leading-normal font-medium">
                Tất cả công việc đã được xếp lịch!
              </div>
              <Button
                size="sm"
                onClick={onConfirmPlan}
                disabled={isConfirming}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] py-2 h-auto font-bold rounded-lg shadow-md cursor-pointer transition-colors"
              >
                {isConfirming ? "..." : t.calendar.confirmPlan}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CalendarSidebar.displayName = "CalendarSidebar";
