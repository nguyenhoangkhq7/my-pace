import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import { useCalendarEvents } from "@/features/calendar";

import type { FixedEventOccurrence, ModalMode } from "@/features/calendar/types";
import { useAuthStore } from "@/features/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyPlanAction, confirmPlanAction } from "@/features/board/actions/plan.action";
import { useBoardStore } from "@/features/board/store/board.store";
import { saveTimeBlocksAction } from "@/features/board/actions/timeblock.action";
import type { TaskTimeBlock, Task, DailyPlanTask } from "@/features/board/types";
import { toast } from "sonner";
import { autoSchedule, type OccupiedSlot } from "@/features/board/utils/autoSchedule";
import { useCalendarInteractions } from "./useCalendarInteractions";
import { getTodayStr } from "@/lib/date";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const EVENT_TEXT      = "#ffffff";
const TASK_COLOR_MIT  = "#6366f1"; // indigo for MITs
const TASK_COLOR_REG  = "#475569"; // slate for regular tasks

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

  const today = getTodayStr(user?.timezone);
  const [focusedDate, setFocusedDate] = useState(today);

  const plannable = useMemo(() => {
    const focused = new Date(focusedDate);
    const t = new Date(today);
    focused.setHours(0,0,0,0);
    t.setHours(0,0,0,0);
    const diffTime = focused.getTime() - t.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }, [focusedDate, today]);

  const queryClient = useQueryClient();
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', focusedDate], queryFn: () => getDailyPlanAction(focusedDate) });
  const timeBlocks = useMemo(() => dailyPlanToday?.timeBlocks || [], [dailyPlanToday?.timeBlocks]);
  
  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => saveTimeBlocksAction({ dailyPlanId: dailyPlanToday!.id, blocks }),
    onSuccess: (data) => {
      if (dailyPlanToday) {
        queryClient.setQueryData(['dailyPlan', focusedDate], { ...dailyPlanToday, timeBlocks: data });
      }
    }
  });

  const confirmPlanMutation = useMutation({
    mutationFn: confirmPlanAction,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['dailyPlan', variables], data);
      if (variables === today) {
        useBoardStore.setState({ isStarted: true });
      }
      toast.success("Đã chốt lịch! Chúc bạn một ngày làm việc hiệu quả.");
    }
  });

  const handleConfirmPlan = useCallback(async () => {
    if (!dailyPlanToday) return;
    try {
      await confirmPlanMutation.mutateAsync(dailyPlanToday.planDate);
    } catch (err) {
      console.error(err);
      toast.error("Không thể xác nhận lịch trình.");
    }
  }, [dailyPlanToday, confirmPlanMutation]);

  const [dateRange, setDateRange] = useState({ start: today, end: today });

  const {
    events,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    deleteAllOccurrences,
    deleteSingleOccurrence,
  } = useCalendarEvents(dateRange);



  const slotMin = toSlotTime(user?.wakeTime, "05:00:00");
  
  let slotMax = "23:00:00";
  if (user?.sleepTime && user?.wakeTime) {
    const [sh, sm] = user.sleepTime.split(":").map(Number);
    const [wh, wm] = user.wakeTime.split(":").map(Number);
    if (sh < wh || (sh === wh && sm < wm)) {
      const adjustedHour = sh + 24;
      slotMax = `${String(adjustedHour).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`;
    } else {
      slotMax = toSlotTime(user.sleepTime, "23:00:00");
    }
  } else {
    slotMax = toSlotTime(user?.sleepTime, "23:00:00");
  }

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
    if (dailyPlanToday.isConfirmed) {
      toast.error("Không thể hủy lịch khi kế hoạch đã được xác nhận (Running).");
      return;
    }
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
      await saveTimeBlocksMutation.mutateAsync(updatedBlocks as Omit<TaskTimeBlock, 'id'>[]);

      const planTask = dailyPlanToday.tasks.find((pt: DailyPlanTask) => pt.task.id === taskId);
      toast.success(`Đã hủy lịch công việc: "${planTask?.task.title || ""}"`);
      setBlockModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể hủy lịch. Vui lòng thử lại.");
    } finally {
      setIsUnscheduling(false);
    }
  }, [dailyPlanToday, timeBlocks, saveTimeBlocksMutation]);

  const isConfirmed = !plannable || !!dailyPlanToday?.isConfirmed;

  // ── Custom Hooks ──────────────────────────────────────────────────────────
  const { handleEventReceive, handleEventDrop, handleEventResize, handleEventDragStop } = useCalendarInteractions({
    dailyPlanToday: dailyPlanToday ?? null,
    timeBlocks,
    isConfirmed,
    saveTimeBlocks: (blocks: Partial<TaskTimeBlock>[]) => saveTimeBlocksMutation.mutateAsync(blocks as Omit<TaskTimeBlock, 'id'>[]),
    updateAllOccurrences,
    updateSingleOccurrence,
    createEvent,
    deleteSingleOccurrence,
    handleUnscheduleTask,
    sidebarRef,
  });

  // ── FullCalendar events ────────────────────────────────────────────────────
  const scheduledTaskIds = useMemo(() => new Set(timeBlocks.map((b) => b.taskId)), [timeBlocks]);

  const fcEvents = useMemo<EventInput[]>(() => {
    const list: EventInput[] = [
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
      }))
    ];

    // Render time blocks unconditionally (whether confirmed or not)
    list.push(
      ...timeBlocks.map((block) => {
        const planTask = dailyPlanToday?.tasks.find((pt: DailyPlanTask) => pt.task.id === block.taskId);
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
          // Editable only when the plan is NOT confirmed (planning mode)
          editable: !isConfirmed,
          durationEditable: !isConfirmed,
          extendedProps: { blockId: block.id, taskId: block.taskId, isTimeBlock: true },
        };
      })
    );

    return list;
  }, [events, timeBlocks, dailyPlanToday, fixedEventColor, isConfirmed]);

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

  // Update FullCalendar size to prevent scrollbar gutter gaps on mount or sidebar toggle
  useEffect(() => {
    if (isCalendarMounted && calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.updateSize();
      const timer = setTimeout(() => {
        api.updateSize();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isCalendarMounted, isSidebarOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    localStorage.setItem("myPaceCalendarView", arg.view.type);
    setDateRange({
      start: arg.startStr.split("T")[0],
      end: arg.endStr.split("T")[0],
    });
    
    const startStr = arg.startStr.split("T")[0];
    const endStr = arg.endStr.split("T")[0];
    if (arg.view.type === "timeGridDay" || arg.view.type === "listDay") {
      setFocusedDate(startStr);
    } else {
      if (today >= startStr && today <= endStr) {
        setFocusedDate(today);
      } else {
        setFocusedDate(startStr);
      }
    }
  }, [today]);

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
      const unscheduledPlanTasks = dailyPlanToday.tasks.filter((pt: DailyPlanTask) => !scheduledTaskIdsSet.has(pt.task.id));

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
        user.sleepTime,
        user.timezone
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
      await saveTimeBlocksMutation.mutateAsync([...existingCleanBlocks, ...newBlocks] as Omit<TaskTimeBlock, 'id'>[]);
      toast.success("Đã tự động sắp xếp các công việc còn lại vào lịch!");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tự động xếp lịch.");
    } finally {
      setIsAutoScheduling(false);
    }
  }, [dailyPlanToday, timeBlocks, events, user, today, saveTimeBlocksMutation]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    if (arg.event.extendedProps.isTimeBlock) {
      const blockId = arg.event.extendedProps.blockId;
      const taskId = arg.event.extendedProps.taskId;
      const block = timeBlocks.find((b) => b.id === blockId);
      const planTask = dailyPlanToday?.tasks.find((pt: DailyPlanTask) => pt.task.id === taskId);

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
  const unscheduledTasks = planTasks.filter((pt: DailyPlanTask) => !scheduledTaskIds.has(pt.task.id) && pt.task.status !== 'Done');
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
    handleConfirmPlan,
    isConfirming: confirmPlanMutation.isPending,

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
    focusedDate,
    plannable,
  };
}
