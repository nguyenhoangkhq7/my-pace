"use client";

import { useEffect, useMemo, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Clock01Icon, MagicWand01Icon } from "@hugeicons/core-free-icons";
import { Draggable } from "@fullcalendar/interaction";
import { cn } from "@/lib/utils";
import type { CalendarTask, CalendarViewTab } from "../types/calendar.type";

function formatMinutes(minutes: number): string {
  return `${minutes}m`;
}

type CalendarTaskSidebarProps = {
  activeTab: CalendarViewTab;
  onTabChangeAction: (tab: CalendarViewTab) => void;
  tasks: CalendarTask[];
  unscheduledTasks: CalendarTask[];
  onAutoScheduleAction: (taskId: number) => Promise<void>;
};

export function CalendarTaskSidebar({
  activeTab,
  onTabChangeAction,
  tasks,
  unscheduledTasks,
  onAutoScheduleAction,
}: CalendarTaskSidebarProps) {
  const externalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!externalContainerRef.current) return;

    const draggable = new Draggable(externalContainerRef.current, {
      itemSelector: ".draggable-task-item",
      eventData(eventEl) {
        return {
          title: eventEl.getAttribute("data-title") || "Task",
          duration: { minutes: Number(eventEl.getAttribute("data-minutes") || "30") },
          extendedProps: {
            taskId: Number(eventEl.getAttribute("data-id") || "0"),
            isTask: true,
          },
        };
      },
    });

    return () => draggable.destroy();
  }, [activeTab, tasks, unscheduledTasks]);

  const visibleTasks = useMemo(
    () => (activeTab === "unscheduled" ? unscheduledTasks : tasks.filter((task) => !task.isDone)),
    [activeTab, tasks, unscheduledTasks],
  );

  return (
    <aside className="order-2 flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-pace-sidebar p-4">
      <div className="mb-4 flex items-center gap-2">
        <HugeiconsIcon icon={Calendar01Icon} size={20} className="text-pace-accent" />
        <div>
          <h2 className="text-base font-semibold text-slate-100">Calendar</h2>
          <p className="text-xs text-slate-400">Kéo task vào lịch hoặc auto-schedule.</p>
        </div>
      </div>

      <div className="mb-3 flex rounded-xl bg-slate-900/60 p-1">
        <button
          onClick={() => onTabChangeAction("unscheduled")}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "unscheduled"
              ? "bg-pace-card text-pace-accent"
              : "text-slate-400 hover:text-slate-100",
          )}
        >
          Chưa lên lịch ({unscheduledTasks.length})
        </button>
        <button
          onClick={() => onTabChangeAction("all")}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "all"
              ? "bg-pace-card text-pace-accent"
              : "text-slate-400 hover:text-slate-100",
          )}
        >
          Tất cả ({tasks.filter((task) => !task.isDone).length})
        </button>
      </div>

      <div ref={externalContainerRef} className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            data-id={task.id}
            data-title={task.title}
            data-minutes={task.estimatedMinutes || 30}
            className={cn(
              "draggable-task-item group relative flex cursor-grab flex-col gap-2 rounded-xl border border-slate-800 bg-pace-card/60 p-3 transition",
              "hover:bg-slate-800/80 active:cursor-grabbing",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">{task.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <HugeiconsIcon icon={Clock01Icon} size={10} />
                  <span>{formatMinutes(task.estimatedMinutes || 30)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void onAutoScheduleAction(task.id);
                }}
                className="rounded-lg bg-pace-accent/15 p-2 text-pace-accent opacity-0 transition group-hover:opacity-100 hover:bg-pace-accent hover:text-slate-950"
                title="Auto-Schedule"
              >
                <HugeiconsIcon icon={MagicWand01Icon} size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="rounded-full bg-slate-900 px-2 py-0.5">Task #{task.id}</span>
              {task.category && <span className="rounded-full bg-slate-900 px-2 py-0.5">{task.category.name}</span>}
            </div>
          </div>
        ))}

        {visibleTasks.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500">Không còn task nào cần lên lịch.</p>
        )}
      </div>
    </aside>
  );
}


