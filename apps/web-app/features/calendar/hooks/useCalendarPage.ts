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

  // ── Modal & UI state ────────────────────────────────────────────────────────
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
      queryClient.invalidateQueries({ queryKey: ['dailyPlans'] });
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
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

  const scrollTime = useMemo(() => {
    return user?.wakeTime ? toSlotTime(user.wakeTime, "06:00:00") : "06:00:00";
  }, [user]);

  const businessHours = useMemo(() => {
    const wake = user?.wakeTime ? user.wakeTime.substring(0, 5) : "06:00";
    const sleep = user?.sleepTime ? user.sleepTime.substring(0, 5) : "22:00";
    if (sleep < wake) {
      return [
        { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "00:00", endTime: sleep },
        { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: wake, endTime: "24:00" },
      ];
    }
    return {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: wake,
      endTime: sleep,
    };
  }, [user]);

  const wakeSleepLineEvents = useMemo<EventInput[]>(() => {
    const formatHHMM = (t: string | undefined | null, fallback: string) => {
      if (!t) return fallback;
      const parts = t.split(":");
      if (parts.length < 2) return fallback;
      const h = String(parts[0]).padStart(2, "0");
      const m = String(parts[1]).padStart(2, "0");
      return `${h}:${m}`;
    };

    const wake = formatHHMM(user?.wakeTime, "08:00");
    const sleep = formatHHMM(user?.sleepTime, "22:00");

    const add15 = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      const totalMins = h * 60 + m + 15;
      const nh = Math.floor(totalMins / 60) % 24;
      const nm = totalMins % 60;
      return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}:00`;
    };

    return [
      {
        id: "wake-line-indicator",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: `${wake}:00`,
        endTime: add15(wake),
        display: "background",
        classNames: ["fc-wake-line-event"],
      },
      {
        id: "sleep-line-indicator",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: `${sleep}:00`,
        endTime: add15(sleep),
        display: "background",
        classNames: ["fc-sleep-line-event"],
      },
    ];
  }, [user]);

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
        const { id, ...copy } = b;
        return copy;
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
  }, [dailyPlanToday, timeBlocks, saveTimeBlocksMutation, setBlockModalOpen]);

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
      ...wakeSleepLineEvents,
      ...(events as unknown as FixedEventOccurrence[]).map((occ) => {
        const color = occ.category?.color || fixedEventColor;
        const isAllDay = !!occ.isAllDay;
        const isFree = occ.availabilityStatus === 'FREE';
        const occEditable = !isAllDay && isOccurrenceEditable(occ.occurrenceDate);
        
        let parsedEndTime = occ.endTime;
        if (!isAllDay && occ.endTime <= occ.startTime && occ.endTime !== "00:00:00") {
           const parts = occ.endTime.split(":");
           const h = parseInt(parts[0], 10) + 24;
           parsedEndTime = `${String(h).padStart(2, '0')}:${parts[1]}:${parts.length > 2 ? parts[2] : "00"}`;
        } else if (!isAllDay && occ.endTime === "00:00:00") {
           parsedEndTime = "24:00:00";
        }

        return {
          id: occ.id,
          title: occ.title,
          start: isAllDay ? occ.occurrenceDate : `${occ.occurrenceDate}T${occ.startTime}`,
          end: isAllDay ? occ.occurrenceDate : `${occ.occurrenceDate}T${parsedEndTime}`,
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

          const start = new Date(block.startTime);
          const end = new Date(block.endTime);
          const blockDuration = Math.round((end.getTime() - start.getTime()) / 60000);

          let fcEndStr = block.endTime;
          const startDateStr = block.startTime.substring(0, 10);
          const endDateStr = block.endTime.substring(0, 10);
          if (startDateStr !== endDateStr) {
             const dStart = new Date(startDateStr);
             const dEnd = new Date(endDateStr);
             const diffDays = Math.round((dEnd.getTime() - dStart.getTime()) / 86400000);
             if (diffDays > 0) {
               const timePart = block.endTime.substring(11);
               const hours = parseInt(timePart.substring(0, 2), 10) + (diffDays * 24);
               fcEndStr = `${startDateStr}T${String(hours).padStart(2, '0')}${timePart.substring(2)}`;
             }
          }

          return {
            id: block.id || `block-${block.taskId}-${block.partIndex}`,
            title: label,
            start: block.startTime,
            end: fcEndStr,
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
              totalLoggedMinutes: block.totalLoggedMinutes || 0,
              blockDuration: blockDuration || 0,
            },
          };
        })
    );

    return list;
  }, [events, allTimeBlocks, plansInRange, fixedEventColor, isConfirmed, tasks, focusedDate, today, wakeSleepLineEvents]);

  const { slotMin, slotMax } = useMemo(() => {
    const wake = user?.wakeTime ? user.wakeTime.substring(0, 5) : "06:00";
    const sleep = user?.sleepTime ? user.sleepTime.substring(0, 5) : "22:00";
    const isNightOwl = sleep < wake;

    const wakeHour = parseInt(wake.substring(0, 2), 10);
    const sleepHour = parseInt(sleep.substring(0, 2), 10);

    let minLogicalHour = Math.max(0, wakeHour - 1);
    let maxLogicalHour = (isNightOwl ? 24 + sleepHour : sleepHour) + 1;

    const updateBounds = (timeStr: string | undefined | null) => {
      if (!timeStr) return;
      
      let h: number;
      if (timeStr.includes("T")) {
        h = parseInt(timeStr.split("T")[1].substring(0, 2), 10);
      } else {
        h = parseInt(timeStr.substring(0, 2), 10);
      }

      if (isNaN(h)) return;

      let logicalHour = h;
      if (isNightOwl && h <= sleepHour + 3) {
        logicalHour = 24 + h;
      } else if (isNightOwl && h > sleepHour + 3 && h < wakeHour - 2) {
        logicalHour = h;
      }

      if (logicalHour < minLogicalHour) minLogicalHour = logicalHour;
      if (logicalHour + 1 > maxLogicalHour) maxLogicalHour = logicalHour + 1;
    };

    fcEvents.forEach((ev) => {
      if (!ev.allDay && ev.display !== "background") { // Ignore background events (sleep/wake lines) for bounds
        updateBounds(ev.start as string);
        updateBounds(ev.end as string);
      }
    });

    minLogicalHour = Math.max(0, Math.min(23, minLogicalHour));
    maxLogicalHour = Math.min(47, Math.max(minLogicalHour + 1, maxLogicalHour));

    const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00:00`;
    
    return {
      slotMin: formatHour(minLogicalHour),
      slotMax: formatHour(maxLogicalHour)
    };
  }, [user, fcEvents]);

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
      queryClient.invalidateQueries({ queryKey: ["weeklyAllocation"] });
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
    scrollTime,
    businessHours,
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
