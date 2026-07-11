"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Draggable } from "@fullcalendar/interaction";
import { DailyPlanTask } from "@/features/board/types";
import { UnscheduledTaskItem } from "./UnscheduledTaskItem";

interface CalendarSidebarProps {
  unscheduledTasks: DailyPlanTask[];
  isAutoScheduling: boolean;
  onAutoSchedule: () => void;
  dailyPlanLength: number;
  timeBlocksLength: number;
  isSidebarOpen: boolean;
}

export const CalendarSidebar = forwardRef<HTMLDivElement, CalendarSidebarProps>(
  ({ unscheduledTasks, isAutoScheduling, onAutoSchedule, dailyPlanLength, timeBlocksLength, isSidebarOpen }, ref) => {
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

    return (
      <div className="w-56 flex-shrink-0 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
          <div>
            <div className="text-xs font-bold text-card-foreground uppercase tracking-wider">Todo Today</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Kéo vào thả để xếp lịch</div>
          </div>
          <Button
            size="sm"
            onClick={onAutoSchedule}
            disabled={isAutoScheduling}
            className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary text-[11px] py-1 h-auto font-semibold rounded-lg"
          >
            {isAutoScheduling ? "Đang xếp lịch..." : "Tự động xếp lịch"}
          </Button>
        </div>

        <div ref={sidebarRef} className="flex-1 overflow-y-auto p-2.5 space-y-1.5 flex flex-col">
          {unscheduledTasks
            .slice()
            .sort((a, b) => (a.isMit === b.isMit ? 0 : a.isMit ? -1 : 1))
            .map((pt) => (
              <UnscheduledTaskItem key={pt.task.id} pt={pt} />
            ))}
        </div>
      </div>
    );
  }
);

CalendarSidebar.displayName = "CalendarSidebar";
