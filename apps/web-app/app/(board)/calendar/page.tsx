"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventInput, EventDropArg } from "@fullcalendar/core";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import type { EventReceiveArg } from "@fullcalendar/interaction";
import { useCalendarEvents } from "@/features/calendar";
import { useAvailableTime, AvailableTimeWidget } from "@/features/available-time";
import { EventModal } from "@/features/calendar/components/EventModal";
import type { FixedEventOccurrence, ModalMode, UpdateOccurrencePayload } from "@/features/calendar/types";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import type { TaskTimeBlock } from "@/features/board/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskTimeBlockModal } from "@/features/board/components/TaskTimeBlockModal";
import type { Task } from "@/features/board/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_COLOR     = "#0ea5e9";
const EVENT_TEXT      = "#ffffff";
const EVENT_HIGHLIGHT = "rgba(14,165,233,0.15)";
const TASK_COLOR_MIT  = "#6366f1"; // indigo for MITs
const TASK_COLOR_REG  = "#475569"; // slate for regular tasks

const todayStr = () => new Date().toISOString().split("T")[0];
const toHHMM = (t: string) => t.substring(0, 5);
const toSlotTime = (t: string | null | undefined, fallback: string) =>
  t ? t.substring(0, 5) + ":00" : fallback;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const calendarRef = useRef<FullCalendar>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);

  const today = todayStr();
  const { data: availableTime, fetchAvailableTime, isLoading: isLoadingAvailableTime } = useAvailableTime();
  const { dailyPlanToday, timeBlocks, saveTimeBlocks, fetchDailyPlanToday } = useBoardStore();

  const {
    events,
    fetchEvents,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    deleteAllOccurrences,
    deleteSingleOccurrence,
  } = useCalendarEvents({
    onMutationSuccess: () => fetchAvailableTime(today),
  });

  // Ensure daily plan (and timeBlocks) are loaded when navigating directly to /calendar
  useEffect(() => {
    fetchAvailableTime(today);
    if (!dailyPlanToday) {
      fetchDailyPlanToday(today);
    }
  }, [today, fetchAvailableTime, dailyPlanToday, fetchDailyPlanToday]);

  const slotMin = toSlotTime(user?.wakeTime, "05:00:00");
  const slotMax = toSlotTime(user?.sleepTime, "23:00:00");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalDefaults, setModalDefaults] = useState<{ date?: string; start?: string; end?: string }>({});
  const [editOccurrence, setEditOccurrence] = useState<FixedEventOccurrence | undefined>();

  // Task Time Block Modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TaskTimeBlock | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isBlockMit, setIsBlockMit] = useState(false);
  const [isUnscheduling, setIsUnscheduling] = useState(false);

  // ── External Draggable setup ──────────────────────────────────────────────
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
        // Color priority: category > MIT purple > slate
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
  }, [dailyPlanToday?.tasks.length]);

  // ── When task dropped from sidebar → save as new time block ──────────────
  const handleEventReceive = useCallback(async (info: EventReceiveArg) => {
    const taskId = info.event.extendedProps?.taskId as string | undefined;
    const planTask = dailyPlanToday?.tasks.find((pt) => pt.task.id === taskId);
    if (!taskId || !planTask || !dailyPlanToday) { info.revert(); return; }

    const startTime = info.event.start;
    const endTime   = info.event.end;
    if (!startTime || !endTime) { info.revert(); return; }

    // Remove any existing blocks for this task (1 manual placement = 1 block)
    const existingBlocks = timeBlocks.filter((b) => b.taskId !== taskId)
      .map(({ id, ...rest }) => rest as Omit<TaskTimeBlock, "id">);

    const newBlock: Omit<TaskTimeBlock, "id"> = {
      taskId,
      dailyPlanId: dailyPlanToday.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      partIndex: 1,
      totalParts: 1,
    };

    try {
      await saveTimeBlocks([...existingBlocks, newBlock]);
      toast.success(`Đã lên lịch: "${planTask.task.title}"`);
    } catch {
      info.revert();
      toast.error("Không thể lưu lịch.");
    }
  }, [dailyPlanToday, timeBlocks, saveTimeBlocks]);

  // ── When a time block is moved on the calendar ────────────────────────────
  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const blockId = info.event.extendedProps?.blockId as string | undefined;
    // If it's a fixed event (no blockId), handle old logic
    if (!blockId) {
      const occ = info.event.extendedProps.occurrence as FixedEventOccurrence | undefined;
      if (!occ) { info.revert(); return; }
      const newStart = info.event.start;
      const newEnd   = info.event.end;
      if (!newStart || !newEnd) { info.revert(); return; }
      const newDate      = newStart.toISOString().split("T")[0];
      const newStartTime = `${String(newStart.getHours()).padStart(2, "0")}:${String(newStart.getMinutes()).padStart(2, "0")}:00`;
      const newEndTime   = `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(2, "0")}:00`;
      try {
        await updateSingleOccurrence(occ.seriesId, newDate, { overrideStartTime: newStartTime, overrideEndTime: newEndTime });
      } catch { info.revert(); }
      return;
    }

    if (!dailyPlanToday) { info.revert(); return; }
    const startTime = info.event.start;
    const endTime   = info.event.end;
    if (!startTime || !endTime) { info.revert(); return; }

    const updatedBlocks = timeBlocks.map((b) =>
      b.id === blockId
        ? { ...b, startTime: startTime.toISOString(), endTime: endTime.toISOString() }
        : b
    ).map(({ id, ...rest }) => rest as Omit<TaskTimeBlock, "id">);

    try {
      await saveTimeBlocks(updatedBlocks);
      toast.success("Đã cập nhật lịch!");
    } catch { info.revert(); }
  }, [dailyPlanToday, timeBlocks, saveTimeBlocks, updateSingleOccurrence]);

  const handleEventResize = useCallback(async (arg: { event: any; revert: () => void }) => {
    const blockId = arg.event.extendedProps?.blockId as string | undefined;
    if (blockId) {
      // Resize a time block
      const newEnd = arg.event.end as Date | null;
      if (!newEnd || !dailyPlanToday) { arg.revert(); return; }
      const updatedBlocks = timeBlocks.map((b) =>
        b.id === blockId ? { ...b, endTime: newEnd.toISOString() } : b
      ).map(({ id, ...rest }) => rest as Omit<TaskTimeBlock, "id">);
      try { await saveTimeBlocks(updatedBlocks); } catch { arg.revert(); }
      return;
    }
    // Resize a fixed event
    const occ = arg.event.extendedProps.occurrence as FixedEventOccurrence | undefined;
    if (!occ) { arg.revert(); return; }
    const newEnd = arg.event.end as Date | null;
    if (!newEnd) { arg.revert(); return; }
    const newEndTime = `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(2, "0")}:00`;
    try { await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, { overrideEndTime: newEndTime }); }
    catch { arg.revert(); }
  }, [dailyPlanToday, timeBlocks, saveTimeBlocks, updateSingleOccurrence]);

  // ── FullCalendar events ────────────────────────────────────────────────────
  const scheduledTaskIds = new Set(timeBlocks.map((b) => b.taskId));

  const fcEvents: EventInput[] = [
    // Fixed events
    ...events.map((occ) => ({
      id: occ.id,
      title: occ.title,
      start: `${occ.occurrenceDate}T${occ.startTime}`,
      end: `${occ.occurrenceDate}T${occ.endTime}`,
      extendedProps: { occurrence: occ },
      backgroundColor: EVENT_COLOR,
      borderColor: EVENT_COLOR,
      textColor: EVENT_TEXT,
      ...(occ.recurrenceType !== "NONE" && { backgroundColor: EVENT_COLOR + "d9" }),
    })),
    // Time blocks — use store `timeBlocks` as single source of truth
    // (avoids the empty-array truthy bug with dailyPlanToday?.timeBlocks)
    ...timeBlocks.map((block) => {
      const planTask = dailyPlanToday?.tasks.find((pt) => pt.task.id === block.taskId);
      const task     = planTask?.task;
      const isMit    = planTask?.isMit || false;

      // Label: show chunk index for split tasks
      const label = block.totalParts > 1
        ? `${task?.title || "Task"} (${block.partIndex}/${block.totalParts})`
        : task?.title || "Task";

      // Color priority: category color > MIT purple > slate
      const color = task?.category?.color
        ? task.category.color
        : isMit
        ? TASK_COLOR_MIT
        : TASK_COLOR_REG;

      return {
        id: block.id || `block-${block.taskId}-${block.partIndex}`,
        title: label,
        start: block.startTime,
        end: block.endTime,
        backgroundColor: color,
        borderColor: color,
        textColor: "#ffffff",
        editable: true,
        extendedProps: { blockId: block.id, taskId: block.taskId, isTimeBlock: true },
      };
    }),
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    fetchEvents(arg.startStr.split("T")[0], arg.endStr.split("T")[0]);
  }, [fetchEvents]);

  const handleSelect = useCallback((arg: DateSelectArg) => {
    const start = arg.startStr;
    const end   = arg.endStr;
    const dateStr  = start.split("T")[0];
    const startStr = start.includes("T") ? toHHMM(start.split("T")[1]) : "09:00";
    const endStr   = end.includes("T")   ? toHHMM(end.split("T")[1])   : "10:00";
    setModalDefaults({ date: dateStr, start: startStr, end: endStr });
    setModalMode("create");
    setEditOccurrence(undefined);
    setModalOpen(true);
  }, []);

  const handleUnscheduleTask = useCallback(async (taskId: string) => {
    if (!dailyPlanToday) return;
    setIsUnscheduling(true);
    // Remove all blocks associated with this task ID
    const updatedBlocks = timeBlocks
      .filter((b) => b.taskId !== taskId)
      .map(({ id, ...rest }) => rest as Omit<TaskTimeBlock, "id">);

    try {
      await saveTimeBlocks(updatedBlocks);
      const planTask = dailyPlanToday.tasks.find((pt) => pt.task.id === taskId);
      toast.success(`Đã hủy lịch công việc: "${planTask?.task.title || ""}"`);
      setBlockModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể hủy lịch. Vui lòng thử lại.");
    } finally {
      setIsUnscheduling(false);
    }
  }, [dailyPlanToday, timeBlocks, saveTimeBlocks]);

  const handleEventDragStop = useCallback((info: any) => {
    if (!info.event.extendedProps.isTimeBlock || !sidebarRef.current) return;

    const rect = sidebarRef.current.getBoundingClientRect();
    const x = info.jsEvent.clientX;
    const y = info.jsEvent.clientY;

    // Check if drop coordinate is inside sidebar bounding box
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      const taskId = info.event.extendedProps.taskId;
      handleUnscheduleTask(taskId);
    }
  }, [handleUnscheduleTask]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    if (arg.event.extendedProps.isTimeBlock) {
      const blockId = arg.event.extendedProps.blockId;
      const taskId = arg.event.extendedProps.taskId;
      const block = timeBlocks.find((b) => b.id === blockId);
      const planTask = dailyPlanToday?.tasks.find((pt) => pt.task.id === taskId);

      if (block && planTask) {
        setSelectedBlock(block);
        setSelectedTask(planTask.task);
        setIsBlockMit(planTask.isMit);
        setBlockModalOpen(true);
      }
      return;
    }
    const occ = arg.event.extendedProps.occurrence as FixedEventOccurrence;
    setEditOccurrence(occ);
    setModalMode("edit");
    setModalDefaults({});
    setModalOpen(true);
  }, [timeBlocks, dailyPlanToday]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const planTasks = dailyPlanToday?.tasks || [];
  const hasPlan   = planTasks.length > 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <AvailableTimeWidget data={availableTime} isLoading={isLoadingAvailableTime} />

      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Todo Today Sidebar ── */}
        <div className="w-56 flex-shrink-0 flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Todo Today</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Kéo vào lịch để lên giờ</div>
          </div>

          {!hasPlan ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center gap-3">
              <div className="text-2xl">📝</div>
              <p className="text-xs text-slate-400">Chưa có kế hoạch hôm nay</p>
              <Button size="sm" className="bg-primary text-white text-xs" onClick={() => window.location.assign("/")}>
                Plan your day
              </Button>
            </div>
          ) : (
            <div ref={sidebarRef} className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {planTasks
                .slice()
                .sort((a, b) => (a.isMit === b.isMit ? 0 : a.isMit ? -1 : 1))
                .map((pt) => {
                  const isScheduled = scheduledTaskIds.has(pt.task.id);
                  const catColor = pt.task.category?.color;
                  // Determine card accent color: category > MIT purple > default
                  const accentColor = catColor || (pt.isMit ? "#6366f1" : null);

                  return (
                    <div
                      key={pt.task.id}
                      data-task-id={isScheduled ? undefined : pt.task.id}
                      data-duration={pt.task.estimatedMinutes || 60}
                      data-title={pt.task.title}
                      data-mit={String(pt.isMit)}
                      data-color={accentColor || ""}
                      className={`p-2 rounded-lg border text-xs select-none transition-all ${
                        isScheduled
                          ? "opacity-40 bg-slate-900 border-slate-800 cursor-default"
                          : "cursor-grab active:cursor-grabbing hover:brightness-110"
                      }`}
                      style={
                        !isScheduled && accentColor
                          ? {
                              backgroundColor: `${accentColor}15`,
                              borderColor: `${accentColor}40`,
                              color: accentColor,
                            }
                          : !isScheduled
                          ? undefined
                          : undefined
                      }
                    >
                      <div className="flex items-start gap-1">
                        {pt.isMit && (
                          <span
                            className="text-[9px] px-1 py-0.5 rounded font-semibold shrink-0"
                            style={
                              accentColor
                                ? { backgroundColor: `${accentColor}30`, color: accentColor }
                                : { backgroundColor: "#6366f130", color: "#6366f1" }
                            }
                          >
                            MIT
                          </span>
                        )}
                        <span className="font-medium line-clamp-2 leading-snug">{pt.task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] opacity-60">
                        {pt.task.estimatedMinutes > 0 && <span>{pt.task.estimatedMinutes}m</span>}
                        {pt.task.category && !pt.isMit && (
                          <span style={{ color: catColor, opacity: 1 }}>{pt.task.category.name}</span>
                        )}
                        {isScheduled && <span className="text-green-400 opacity-100">✓ Đã lên lịch</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ── FullCalendar ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kéo task từ sidebar → lịch · Click để tạo sự kiện · Kéo thả để di chuyển
              </p>
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden shadow-sm calendar-wrapper">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridDay"
              headerToolbar={{
                left:   "prev,next today",
                center: "title",
                right:  "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{ today: "Hôm nay", month: "Tháng", week: "Tuần", day: "Ngày" }}
              locale="vi"
              firstDay={1}
              slotMinTime={slotMin}
              slotMaxTime={slotMax}
              allDaySlot={false}
              nowIndicator
              selectable
              selectMirror
              editable
              droppable
              eventResizableFromStart={false}
              events={fcEvents}
              datesSet={handleDatesSet}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventReceive={handleEventReceive}
              eventDragStop={handleEventDragStop}
              height="100%"
            />
          </div>
        </div>
      </div>

      <EventModal
        open={modalOpen}
        mode={modalMode}
        defaultDate={modalDefaults.date}
        defaultStart={modalDefaults.start}
        defaultEnd={modalDefaults.end}
        occurrence={editOccurrence}
        onClose={() => setModalOpen(false)}
        createEvent={createEvent}
        updateAllOccurrences={updateAllOccurrences}
        updateSingleOccurrence={updateSingleOccurrence}
        deleteAllOccurrences={deleteAllOccurrences}
        deleteSingleOccurrence={deleteSingleOccurrence}
      />

      <TaskTimeBlockModal
        open={blockModalOpen}
        block={selectedBlock}
        task={selectedTask}
        isMit={isBlockMit}
        onClose={() => setBlockModalOpen(false)}
        onUnschedule={handleUnscheduleTask}
        isSubmitting={isUnscheduling}
      />

      <style>{`
        .calendar-wrapper .fc { font-family: inherit; }
        .calendar-wrapper .fc-toolbar-title { font-size: 1rem; font-weight: 700; }
        .calendar-wrapper .fc-button {
          background-color: hsl(var(--secondary)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          box-shadow: none !important;
          border-radius: 0.5rem !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          padding: 0.3rem 0.7rem !important;
        }
        .calendar-wrapper .fc-button:hover { background-color: hsl(var(--accent)) !important; }
        .calendar-wrapper .fc-button-active,
        .calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active {
          background-color: ${EVENT_COLOR} !important;
          border-color: ${EVENT_COLOR} !important;
          color: #fff !important;
        }
        .calendar-wrapper .fc-timegrid-slot { height: 2.5rem; }
        .calendar-wrapper .fc-event {
          border-radius: 0.4rem !important;
          border: none !important;
          padding: 2px 5px !important;
          font-size: 0.75rem !important;
          cursor: pointer !important;
        }
        .calendar-wrapper .fc-highlight { background: ${EVENT_HIGHLIGHT} !important; }
        .calendar-wrapper .fc-day-today { background-color: ${EVENT_HIGHLIGHT} !important; }
        .calendar-wrapper .fc-col-header-cell-cushion,
        .calendar-wrapper .fc-timegrid-axis-cushion,
        .calendar-wrapper .fc-timegrid-slot-label-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.7rem;
          font-weight: 600;
        }
        .calendar-wrapper .fc-scrollgrid { border-color: hsl(var(--border)) !important; }
        .calendar-wrapper td, .calendar-wrapper th { border-color: hsl(var(--border)) !important; }
        /* Dragging ghost style */
        .fc-event-dragging { opacity: 0.85 !important; }
      `}</style>
    </div>
  );
}
