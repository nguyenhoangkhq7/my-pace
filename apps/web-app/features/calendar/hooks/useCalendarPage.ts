import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import { useCalendarEvents } from "@/features/calendar";
import { useAvailableTime } from "@/features/available-time";
import type { FixedEventOccurrence, ModalMode } from "@/features/calendar/types";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import type { TaskTimeBlock, Task } from "@/features/board/types";
import { toast } from "sonner";
import { autoSchedule, type OccupiedSlot } from "@/features/board/utils/autoSchedule";
import { useCalendarInteractions } from "./useCalendarInteractions";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const EVENT_TEXT      = "#ffffff";
const TASK_COLOR_MIT  = "#6366f1"; // indigo for MITs
const TASK_COLOR_REG  = "#475569"; // slate for regular tasks

const todayStr = () => new Date().toISOString().split("T")[0];
const toHHMM = (t: string) => t.substring(0, 5);
const toSlotTime = (t: string | null | undefined, fallback: string) =>
  t ? t.substring(0, 5) + ":00" : fallback;
const toLocalDateStr = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const toLocalTimeStr = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export function useCalendarPage() {
  const user = useAuthStore((s) => s.user);
  const calendarRef = useRef<FullCalendar>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const today = todayStr();
  const { fetchAvailableTime } = useAvailableTime();
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
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fixedEventColor, setFixedEventColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myPaceFixedEventColor") || "#0ea5e9";
    }
    return "#0ea5e9";
  });

  const handleColorChange = (color: string) => {
    setFixedEventColor(color);
    localStorage.setItem("myPaceFixedEventColor", color);
  };

  const handleUnscheduleTask = useCallback(async (taskId: string) => {
    if (!dailyPlanToday) return;
    setIsUnscheduling(true);
    // Remove all blocks associated with this task ID
    const updatedBlocks = timeBlocks
      .filter((b) => b.taskId !== taskId)
      .map((b) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rest } = b;
        return rest as Omit<TaskTimeBlock, "id">;
      });

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

  // ── Custom Hooks ──────────────────────────────────────────────────────────
  const { handleEventReceive, handleEventDrop, handleEventResize, handleEventDragStop } = useCalendarInteractions({
    dailyPlanToday,
    timeBlocks,
    saveTimeBlocks,
    updateAllOccurrences,
    updateSingleOccurrence,
    createEvent,
    deleteSingleOccurrence,
    handleUnscheduleTask,
    sidebarRef,
  });

  // ── FullCalendar events ────────────────────────────────────────────────────
  const scheduledTaskIds = useMemo(() => new Set(timeBlocks.map((b) => b.taskId)), [timeBlocks]);

  const fcEvents = useMemo<EventInput[]>(() => [
    // Fixed events
    ...events.map((occ) => ({
      id: occ.id,
      title: occ.title,
      start: `${occ.occurrenceDate}T${occ.startTime}`,
      end: `${occ.occurrenceDate}T${occ.endTime}`,
      extendedProps: { occurrence: occ },
      backgroundColor: fixedEventColor,
      borderColor: fixedEventColor,
      textColor: EVENT_TEXT,
      ...(occ.recurrenceType !== "NONE" && { backgroundColor: fixedEventColor + "d9" }),
    })),
    // Time blocks
    ...timeBlocks.map((block) => {
      const planTask = dailyPlanToday?.tasks.find((pt) => pt.task.id === block.taskId);
      const task     = planTask?.task;
      const isMit    = planTask?.isMit || false;

      const label = block.totalParts > 1
        ? `${task?.title || "Task"} (${block.partIndex}/${block.totalParts})`
        : task?.title || "Task";

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
        durationEditable: false,
        extendedProps: { blockId: block.id, taskId: block.taskId, isTimeBlock: true },
      };
    }),
  ], [events, timeBlocks, dailyPlanToday, fixedEventColor]);

  const [initialView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myPaceCalendarView") || "timeGridDay";
    }
    return "timeGridDay";
  });
  const [isCalendarMounted, setIsCalendarMounted] = useState(false);

  // Restore saved view on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsCalendarMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    localStorage.setItem("myPaceCalendarView", arg.view.type);
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

  const handleAutoScheduleFromSidebar = useCallback(async () => {
    if (!dailyPlanToday || !user?.wakeTime || !user?.sleepTime) {
      toast.error("Không thể tự động lên lịch. Hãy kiểm tra lại cài đặt giờ thức/ngủ.");
      return;
    }

    setIsAutoScheduling(true);
    try {
      const scheduledTaskIdsSet = new Set(timeBlocks.map((b) => b.taskId));
      const unscheduledPlanTasks = dailyPlanToday.tasks.filter((pt) => !scheduledTaskIdsSet.has(pt.task.id));

      if (unscheduledPlanTasks.length === 0) {
        toast.info("Tất cả công việc đã được lên lịch!");
        return;
      }

      const occupiedSlots: OccupiedSlot[] = [
        ...events.map((e) => ({
          date: e.occurrenceDate,
          startTime: e.startTime.substring(0, 5),
          endTime: e.endTime.substring(0, 5),
        })),
        ...timeBlocks.map((tb) => ({
          date: toLocalDateStr(tb.startTime),
          startTime: toLocalTimeStr(tb.startTime),
          endTime: toLocalTimeStr(tb.endTime),
        })),
      ];

      const newBlocks = autoSchedule(
        unscheduledPlanTasks,
        occupiedSlots,
        dailyPlanToday.id,
        today,
        user.wakeTime,
        user.sleepTime
      );

      if (newBlocks.length === 0) {
        toast.warning("Không còn đủ khoảng trống thời gian tối thiểu (30 phút) để xếp lịch tự động cho các task còn lại.");
        return;
      }

      const existingCleanBlocks = timeBlocks.map((b) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...rest } = b;
        return rest as Omit<TaskTimeBlock, "id">;
      });
      await saveTimeBlocks([...existingCleanBlocks, ...newBlocks]);
      toast.success("Đã tự động sắp xếp các công việc còn lại vào lịch!");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tự động xếp lịch.");
    } finally {
      setIsAutoScheduling(false);
    }
  }, [dailyPlanToday, timeBlocks, events, user, today, saveTimeBlocks]);

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

  const planTasks = dailyPlanToday?.tasks || [];
  const hasPlan   = planTasks.length > 0;
  const unscheduledTasks = planTasks.filter((pt) => !scheduledTaskIds.has(pt.task.id));
  const hasUnscheduled = hasPlan && unscheduledTasks.length > 0;

  return {
    calendarRef,
    sidebarRef,
    slotMin,
    slotMax,
    fcEvents,
    initialView,
    isCalendarMounted,
    isSidebarOpen,
    setIsSidebarOpen,
    fixedEventColor,
    handleColorChange,
    unscheduledTasks,
    hasUnscheduled,
    isAutoScheduling,
    handleAutoScheduleFromSidebar,
    modalOpen,
    setModalOpen,
    modalMode,
    modalDefaults,
    editOccurrence,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    deleteAllOccurrences,
    deleteSingleOccurrence,
    blockModalOpen,
    setBlockModalOpen,
    selectedBlock,
    selectedTask,
    isBlockMit,
    handleUnscheduleTask,
    isUnscheduling,

    // Event interactions
    handleDatesSet,
    handleSelect,
    handleEventClick,
    handleEventDrop,
    handleEventResize,
    handleEventReceive,
    handleEventDragStop,

    // Store data
    dailyPlanToday,
    timeBlocks,
  };
}
