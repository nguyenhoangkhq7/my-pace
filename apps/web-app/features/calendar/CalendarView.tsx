"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { useEvents } from "@/hooks/useEvents";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";
import { useTasks } from "@/hooks/useTasks";
import { CalendarScheduleSection } from "../../components/calendar/CalendarScheduleSection";
import { CalendarTaskSidebar } from "../../components/calendar/CalendarTaskSidebar";
import type { CalendarViewTab, ScheduledEventMeta } from "./types";

export function CalendarView() {
  const { events, fetchEvents } = useEvents();
  const { tasks, fetchTasks } = useTasks();
  const {
    scheduledTasks,
    loading: scheduledLoading,
    fetchScheduledTasks,
    scheduleTaskAction,
    updateScheduledAction,
    unscheduleTaskAction,
    autoScheduleAction,
  } = useScheduledTasks();

  const [activeTab, setActiveTab] = useState<CalendarViewTab>("unscheduled");

  useEffect(() => {
    fetchEvents();
    fetchTasks();
    fetchScheduledTasks();
  }, [fetchEvents, fetchScheduledTasks, fetchTasks]);

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
    const candidates = activeTab === "unscheduled" ? unscheduledTasks : tasks.filter((task) => !task.isDone);
    const firstTask = candidates[0];
    if (!firstTask) return;

    const start = selectInfo.startStr;
    const fallbackEnd = new Date(
      selectInfo.start.getTime() + (firstTask.estimatedMinutes || 30) * 60000,
    ).toISOString();
    const end = selectInfo.endStr || fallbackEnd;

    await scheduleTaskAction(firstTask.id, start, end);
    await fetchScheduledTasks();
  };

  const syncScheduledChange = async (taskEvent: {
    extendedProps: ScheduledEventMeta;
    startStr: string;
    endStr: string | null;
  }) => {
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

  const handleAutoScheduleAction = async (taskId: number) => {
    await autoScheduleAction(taskId);
    await fetchScheduledTasks();
  };

  if (scheduledLoading && events.length === 0 && tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <HugeiconsIcon icon={Loading03Icon} size={28} className="animate-spin text-pace-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 gap-6 overflow-hidden">
      <CalendarTaskSidebar
        activeTab={activeTab}
        onTabChangeAction={setActiveTab}
        tasks={tasks}
        unscheduledTasks={unscheduledTasks}
        onAutoScheduleAction={handleAutoScheduleAction}
      />

      <CalendarScheduleSection
        calendarEvents={calendarEvents}
        onDateSelectAction={handleDateSelect}
        onEventDropAction={handleEventDrop}
        onEventResizeAction={handleEventResize}
        onEventClickAction={handleEventClick}
      />
    </div>
  );
}




