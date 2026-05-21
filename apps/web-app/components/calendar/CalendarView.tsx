"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Clock01Icon, MagicWand01Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";

function formatMinutes(minutes: number): string {
  return `${minutes}m`;
}

type ScheduledEventMeta = {
  isTask?: boolean;
  dbId?: number;
  taskId?: number;
};

export function CalendarView() {
  const { events, fetchEvents } = useEvents();
  const { tasks, fetchTasks } = useTasks();
  const {
    scheduledTasks,
    fetchScheduledTasks,
    scheduleTaskAction,
    updateScheduledAction,
    unscheduleTaskAction,
    autoScheduleAction,
  } = useScheduledTasks();

  const [activeTab, setActiveTab] = useState<"unscheduled" | "all">("unscheduled");
  const externalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
    fetchTasks();
    fetchScheduledTasks();
  }, [fetchEvents, fetchTasks, fetchScheduledTasks]);

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
  }, [tasks, scheduledTasks]);

  const scheduledTaskIds = useMemo(() => new Set(scheduledTasks.map((st) => st.taskId)), [scheduledTasks]);
  const unscheduledTasks = useMemo(
    () => tasks.filter((task) => !task.isDone && !scheduledTaskIds.has(task.id)),
    [tasks, scheduledTaskIds],
  );

  const calendarEvents = useMemo<EventInput[]>(
    () => [
      ...events.map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        start: event.startAt,
        end: event.endAt,
        backgroundColor: event.color || "#3b82f6",
        borderColor: event.color || "#3b82f6",
        textColor: "#ffffff",
        extendedProps: { isTask: false, dbId: event.id },
      })),
      ...scheduledTasks.map((scheduled) => ({
        id: `task-${scheduled.id}`,
        title: `📝 ${scheduled.taskTitle}`,
        start: scheduled.startTime,
        end: scheduled.endTime,
        backgroundColor: "rgba(139, 92, 246, 0.15)",
        borderColor: scheduled.categoryColor || "#8b5cf6",
        textColor: "#e2e8f0",
        classNames: ["border-2", "border-dashed"],
        extendedProps: {
          isTask: true,
          dbId: scheduled.id,
          taskId: scheduled.taskId,
        },
      })),
    ],
    [events, scheduledTasks],
  );

  const handleDateSelect = async (selectInfo: DateSelectArg) => {
    const firstTask = (activeTab === "unscheduled" ? unscheduledTasks : tasks.filter((task) => !task.isDone))[0];
    if (!firstTask) return;

    const start = selectInfo.startStr;
    const fallbackEnd = new Date(
      selectInfo.start.getTime() + (firstTask.estimatedMinutes || 30) * 60000,
    ).toISOString();
    const end = selectInfo.endStr || fallbackEnd;

    await scheduleTaskAction(firstTask.id, start, end);
    await fetchScheduledTasks();
  };

  const syncScheduledChange = async (taskEvent: { extendedProps: ScheduledEventMeta; startStr: string; endStr: string | null }) => {
    if (!taskEvent.extendedProps.isTask || !taskEvent.extendedProps.dbId) return;

    await updateScheduledAction(
      taskEvent.extendedProps.dbId,
      taskEvent.startStr,
      taskEvent.endStr || taskEvent.startStr,
    );
  };

  const handleEventDrop = (info: EventDropArg) => {
    void syncScheduledChange({
      extendedProps: info.event.extendedProps as ScheduledEventMeta,
      startStr: info.event.startStr,
      endStr: info.event.endStr,
    });
  };

  const handleEventResize = (info: EventResizeDoneArg) => {
    void syncScheduledChange({
      extendedProps: info.event.extendedProps as ScheduledEventMeta,
      startStr: info.event.startStr,
      endStr: info.event.endStr,
    });
  };

  const handleEventClick = async (info: EventClickArg) => {
    const meta = info.event.extendedProps as ScheduledEventMeta;
    if (!meta.isTask || !meta.dbId) return;

    if (confirm(`Gỡ tác vụ "${info.event.title.replace(/^📝\s*/, "")}" khỏi lịch?`)) {
      await unscheduleTaskAction(meta.dbId);
      await fetchScheduledTasks();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 gap-6 overflow-hidden">
      <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-pace-sidebar p-4">
        <div className="mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Calendar01Icon} size={20} className="text-pace-accent" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">Calendar</h2>
            <p className="text-xs text-slate-400">Kéo task vào lịch hoặc auto-schedule.</p>
          </div>
        </div>

        <div className="mb-3 flex rounded-xl bg-slate-900/60 p-1">
          <button
            onClick={() => setActiveTab("unscheduled")}
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
            onClick={() => setActiveTab("all")}
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
          {(activeTab === "unscheduled" ? unscheduledTasks : tasks.filter((task) => !task.isDone)).map((task) => (
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
                    void autoScheduleAction(task.id).then(() => fetchScheduledTasks());
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

          {((activeTab === "unscheduled" ? unscheduledTasks : tasks.filter((task) => !task.isDone)).length === 0) && (
            <p className="py-8 text-center text-xs text-slate-500">Không còn task nào cần lên lịch.</p>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-pace-sidebar p-5 shadow-inner">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Task01Icon} size={18} className="text-pace-accent" />
            <h2 className="text-base font-semibold text-slate-100">Lịch biểu</h2>
          </div>
          <p className="text-xs text-slate-400">Drag & drop task vào khung giờ trống</p>
        </div>

        <div className="min-h-0 flex-1">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay,dayGridMonth",
            }}
            editable
            droppable
            selectable
            selectMirror
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            events={calendarEvents}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            height="100%"
          />
        </div>
      </section>
    </div>
  );
}

