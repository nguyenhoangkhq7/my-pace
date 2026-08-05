import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import { useCalendarEvents } from "@/features/calendar";

import type { FixedEventOccurrence, ModalMode } from "@/features/calendar/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import type { TaskTimeBlock, Task, DailyPlanTask, DailyPlan } from "@/features/board/types";
import { toast } from "sonner";
import { fetchClient } from "@/lib/fetchClient";
import { useCalendarInteractions } from "./useCalendarInteractions";
import { getTodayStr } from "@/lib/date";
import { useRouter } from "next/navigation";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";

import { useTaskTimeBlocks } from "@/features/board/hooks/useTaskTimeBlocks";
import { useTasks } from "@/features/board/hooks/useTasks";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const EVENT_TEXT      = "#ffffff";
const TASK_COLOR_MIT  = "#6366f1"; // indigo for MITs
const TASK_COLOR_REG  = "#475569"; // slate for regular tasks

const toHHMM = (t: string) => t.substring(0, 5);
const toSlotTime = (t: string | null | undefined, fallback: string) =>
  t ? t.substring(0, 5) + ":00" : fallback;

export function useCalendarPage() {
  const router = useRouter();
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

  const { tasks } = useTasks();
  const { triggerAutoSchedule } = useAutoSchedule();

  // dateRange tracks the visible calendar window (updated by handleDatesSet)
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  // ── Fetch daily plan for focused date (sidebar + interactions) ────────────
  const { data: dailyPlanToday } = useQuery({
    queryKey: ['dailyPlan', focusedDate],
    queryFn: () => fetchClient.get<DailyPlan>(`daily-plans/${focusedDate}`).then(r => r.data),
  });

  // ── Fetch ALL daily plans in the visible calendar range ───────────────────
  const { data: plansInRange } = useQuery({
    queryKey: ['dailyPlans', dateRange.start, dateRange.end],
    queryFn: () =>
      fetchClient
        .get<DailyPlan[]>(`daily-plans/range?startDate=${dateRange.start}&endDate=${dateRange.end}`)
        .then(r => r.data),
    enabled: !!dateRange.start && !!dateRange.end,
  });

  const datesWithPlanSet = useMemo(() => {
    const set = new Set<string>();
    if (plansInRange) {
      for (const p of plansInRange) {
        if (p.tasks && p.tasks.length > 0) {
          set.add(p.planDate);
        }
      }
    }
    return set;
  }, [plansInRange]);

  const {
    events,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    updateFromDateOnwards,
    deleteAllOccurrences,
    deleteSingleOccurrence,
    deleteFromDateOnwards,
  } = useCalendarEvents(dateRange);

  // All time blocks across the visible range (used for fcEvents)
  const { data: allTimeBlocks = [] } = useTaskTimeBlocks(dateRange.start, dateRange.end);

  // Time blocks for focused date only (used for interactions / save)
  const { data: timeBlocks = [] } = useTaskTimeBlocks(focusedDate, focusedDate);

  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => fetchClient.post<TaskTimeBlock[]>('time-blocks/batch', { targetDate: focusedDate, blocks }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
    }
  });

  const handleToggleBlockLock = useCallback(async (blockId: string, currentStatus: string) => {
    const newStatus: "BUSY" | "FREE" = currentStatus === "BUSY" ? "FREE" : "BUSY";
    try {
      await fetchClient.patch(`time-blocks/${blockId}/lock-status`, { availabilityStatus: newStatus });
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
      toast.success(newStatus === "BUSY" ? "Đã khóa công việc!" : "Đã mở khóa công việc!");
      setBlockModalOpen(false);
      triggerAutoSchedule();
    } catch {
      toast.error("Không thể thay đổi trạng thái.");
    }
  }, [triggerAutoSchedule, queryClient]);

  const confirmPlanMutation = useMutation({
    mutationFn: (date: string) => fetchClient.post<DailyPlan>(`daily-plans/${date}/confirm`, {}).then(r => r.data),
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
      router.push("/flow");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xác nhận lịch trình.");
    }
  }, [dailyPlanToday, confirmPlanMutation, router]);

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
  const [isBlockInPlan, setIsBlockInPlan] = useState(false);
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
  const updateTimeBlockMutation = useMutation({
    mutationFn: (args: { id: string, data: { startTime?: string, endTime?: string, availabilityStatus?: string } }) => 
      fetchClient.patch(`time-blocks/${args.id}`, args.data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
    }
  });

  const { handleEventReceive, handleEventDrop, handleEventResize, handleEventDragStop } = useCalendarInteractions({
    dailyPlanToday: dailyPlanToday ?? null,
    timeBlocks,
    isConfirmed: dailyPlanToday?.isConfirmed ?? false,
    saveTimeBlocks: (blocks) => saveTimeBlocksMutation.mutateAsync(blocks),
    updateTimeBlock: (id, data) => updateTimeBlockMutation.mutateAsync({ id, data }),
    updateAllOccurrences,
    updateSingleOccurrence,
    createEvent,
    deleteSingleOccurrence,
    handleUnscheduleTask,
    sidebarRef,
  });

  // ── FullCalendar events ────────────────────────────────────────────────────
  const scheduledTaskIds = useMemo(() => new Set(timeBlocks.map((b) => b.taskId)), [timeBlocks]);

  const hasAllDayEvents = useMemo(() => {
    return events.some((e) => !!e.isAllDay);
  }, [events]);

  const fcEvents = useMemo<EventInput[]>(() => {
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);

    const isOccurrenceEditable = (occDate: string): boolean => {
      const d = new Date(occDate);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      // Only allow drag if within plannable window (today ~ today+3)
      // and the focused date's plan is not confirmed
      if (diffDays < 0 || diffDays > 3) return false;
      // Check if plan for that specific date is confirmed
      const planForDate = plansInRange?.find(p => p.planDate === occDate);
      return !planForDate?.isConfirmed;
    };

    const list: EventInput[] = [
      ...(events as unknown as FixedEventOccurrence[]).map((occ) => {
        const color = occ.category?.color || fixedEventColor;
        const isAllDay = !!occ.isAllDay;
        const isFree = occ.availabilityStatus === 'FREE';
        const occEditable = !isAllDay && isOccurrenceEditable(occ.occurrenceDate);
        return {
          id: occ.id,
          title: occ.title,
          start: isAllDay ? occ.occurrenceDate : `${occ.occurrenceDate}T${occ.startTime}`,
          end: isAllDay ? occ.occurrenceDate : `${occ.occurrenceDate}T${occ.endTime}`,
          allDay: isAllDay,
          editable: occEditable,
          durationEditable: occEditable,
          extendedProps: {
            occurrence: occ,
            isTimeBlock: false,
            isFree,
            isBusy: !isFree,
          },
          backgroundColor: isFree ? `${color}25` : color,
          borderColor: isFree ? color : color,
          textColor: isFree ? color : EVENT_TEXT,
          classNames: ['fc-event-item', isFree ? 'fc-event-free' : 'fc-event-busy'],
          ...(occ.recurrenceType !== "NONE" && !isFree && { backgroundColor: color + "d9" }),
        };
      })
    ];

    const taskLookup = new Map<string, Task>();
    for (const t of tasks) {
      taskLookup.set(t.id, t);
    }

    list.push(
      ...allTimeBlocks
        .filter((block) => {
          // Deduplicate / Filter stale FREE blocks for tasks that are no longer in that date's plan
          const blockDate = block.startTime.substring(0, 10);
          const planForBlockDate = plansInRange?.find(p => p.planDate === blockDate);
          
          // If a plan exists for this date, verify if task is in this date's plan
          if (planForBlockDate && planForBlockDate.tasks && planForBlockDate.tasks.length > 0) {
            const inThisPlan = planForBlockDate.tasks.some(pt => pt.task.id === block.taskId);
            if (!inThisPlan && block.availabilityStatus !== 'BUSY') {
              // Block is FREE and task is NOT in this date's plan -> stale/orphaned block
              return false;
            }
          }
          return true;
        })
        .map((block) => {
          const task = taskLookup.get(block.taskId);
          const blockDate = block.startTime.substring(0, 10);
          
          let isMit = task?.isImportant || false;
          let isInPlan = false;
          if (plansInRange) {
            const planForBlockDate = plansInRange.find(p => p.planDate === blockDate);
            if (planForBlockDate) {
              const pt = planForBlockDate.tasks?.find(p => p.task.id === block.taskId);
              if (pt) {
                isMit = pt.isMit;
                isInPlan = true;
              }
            }
          }

          const label = block.totalParts > 1
            ? `${task?.title || "Task"} (${block.partIndex}/${block.totalParts})`
            : task?.title || "Task";

          const color = task?.category?.color
            ? task.category.color
            : isMit
            ? TASK_COLOR_MIT
            : TASK_COLOR_REG;

          const blockBelongsToFocused = block.startTime.startsWith(focusedDate);
          const blockEditable = blockBelongsToFocused && !isConfirmed && isInPlan;
          const isBlockBusy = block.availabilityStatus === 'BUSY';

          return {
            id: block.id || `block-${block.taskId}-${block.partIndex}`,
            title: label,
            start: block.startTime,
            end: block.endTime,
            backgroundColor: color,
            borderColor: color,
            textColor: "#ffffff",
            editable: blockEditable,
            durationEditable: blockEditable,
            classNames: [
              'fc-task-block',
              isBlockBusy ? 'fc-task-busy' : 'fc-task-free',
              !isInPlan ? 'fc-block-not-in-plan' : ''
            ].filter(Boolean),
            extendedProps: {
              blockId: block.id,
              taskId: block.taskId,
              taskTitle: task?.title || "Task",
              partIndex: block.partIndex,
              totalParts: block.totalParts,
              isMit,
              isTimeBlock: true,
              isBusy: isBlockBusy,
              isFree: !isBlockBusy,
              isInPlan,
            },
          };
        })
    );

    return list;
  }, [events, allTimeBlocks, plansInRange, fixedEventColor, isConfirmed, tasks, focusedDate, today]);

  const [initialView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myPaceCalendarView") || "timeGridDay";
    }
    return "timeGridDay";
  });
  const [isCalendarMounted, setIsCalendarMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsCalendarMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
    setIsAutoScheduling(true);
    try {
      await fetchClient.post("auto-schedule", {});
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      toast.success("Đã tự động sắp xếp các công việc vào lịch!");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tự động xếp lịch.");
    } finally {
      setIsAutoScheduling(false);
    }
  }, [queryClient]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    if (arg.event.extendedProps.isTimeBlock) {
      const blockId = arg.event.extendedProps.blockId;
      const taskId = arg.event.extendedProps.taskId;
      const block = allTimeBlocks.find((b) => b.id === blockId) || timeBlocks.find((b) => b.id === blockId);
      let task = tasks.find(t => t.id === taskId) || null;
      
      let isMit = task?.isImportant || false;
      const planTask = dailyPlanToday?.tasks.find((pt: DailyPlanTask) => pt.task.id === taskId);
      if (planTask) {
        task = planTask.task;
        isMit = planTask.isMit;
      }

      if (block && task) {
        setSelectedBlock(block);
        setSelectedTask(task);
        setIsBlockMit(isMit);
        setIsBlockInPlan(arg.event.extendedProps.isInPlan);
        setBlockModalOpen(true);
      }
      return;
    }
    const occ = arg.event.extendedProps.occurrence as FixedEventOccurrence;
    setEditOccurrence(occ);
    setModalMode("edit");
    setModalDefaults({});
    setModalOpen(true);
  }, [allTimeBlocks, timeBlocks, dailyPlanToday, tasks]);

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
    handleToggleBlockLock,
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
    updateFromDateOnwards,
    deleteAllOccurrences,
    deleteSingleOccurrence,
    deleteFromDateOnwards,

    blockModalOpen,
    setBlockModalOpen,
    selectedBlock,
    selectedTask,
    isBlockMit,
    isBlockInPlan,
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
    hasAllDayEvents,
    dailyPlanToday,
    timeBlocks,
    datesWithPlanSet,

    focusedDate,
    plannable,
  };
}
