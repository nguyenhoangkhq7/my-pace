import { useCallback } from "react";
import { toast } from "sonner";
import type { EventDropArg } from "@fullcalendar/core";
import type { EventReceiveArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import type { FixedEventOccurrence, CreateEventPayload, UpdateOccurrencePayload } from "@/features/calendar/types";
import type { DailyPlan, TaskTimeBlock } from "@/features/board/types";
import { toLocalISOString } from "@/lib/date";
import { useQueryClient } from "@tanstack/react-query";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";

interface UseCalendarInteractionsProps {
  dailyPlanToday: DailyPlan | null;
  timeBlocks: TaskTimeBlock[];
  isConfirmed: boolean;
  saveTimeBlocks: (blocks: Omit<TaskTimeBlock, 'id'>[]) => Promise<unknown>;
  updateTimeBlock: (blockId: string, data: { startTime?: string, endTime?: string, availabilityStatus?: string }) => Promise<unknown>;
  updateAllOccurrences: (seriesId: string, data: CreateEventPayload) => Promise<unknown>;
  updateSingleOccurrence: (seriesId: string, date: string, data: UpdateOccurrencePayload) => Promise<unknown>;
  createEvent: (data: CreateEventPayload) => Promise<unknown>;
  deleteSingleOccurrence: (seriesId: string, date: string) => Promise<unknown>;
  handleUnscheduleTask: (taskId: string) => void;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
}

export function useCalendarInteractions({
  dailyPlanToday,
  timeBlocks,
  isConfirmed,
  saveTimeBlocks,
  updateTimeBlock,
  updateAllOccurrences,
  updateSingleOccurrence,
  createEvent,
  deleteSingleOccurrence,
  handleUnscheduleTask,
  sidebarRef,
}: UseCalendarInteractionsProps) {
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

  const handleEventReceive = useCallback(
    async (info: EventReceiveArg) => {
      const taskId = info.event.extendedProps?.taskId as string | undefined;
      const isMit = info.event.extendedProps?.isMit as boolean | undefined;

      if (!taskId || !dailyPlanToday) {
        info.event.remove();
        return;
      }

      if (isConfirmed) {
        toast.error("Không thể thêm lịch cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
        info.event.remove();
        return;
      }

      const start = info.event.start;
      const end = info.event.end || (start ? new Date(start.getTime() + 30 * 60000) : null);

      if (!start || !end) {
        info.event.remove();
        return;
      }

      const newBlock: Omit<TaskTimeBlock, 'id'> = {
        taskId,
        startTime: toLocalISOString(start),
        endTime: toLocalISOString(end),
        partIndex: 1,
        totalParts: 1,
        dailyPlanId: dailyPlanToday.id,
        isMit: !!isMit,
        availabilityStatus: "BUSY",
      };

      const updatedBlocks: Omit<TaskTimeBlock, 'id'>[] = [
        ...timeBlocks.map((b) => {
          const copy = { ...b } as Partial<TaskTimeBlock>;
          delete copy.id;
          return copy as Omit<TaskTimeBlock, 'id'>;
        }),
        newBlock,
      ];

      info.event.remove();

      try {
        await saveTimeBlocks(updatedBlocks);
        toast.success("Đã thêm công việc vào lịch trình!");
        triggerAutoSchedule();
      } catch (err) {
        console.error(err);
        toast.error("Không thể lưu vị trí công việc.");
      }
    },
    [dailyPlanToday, timeBlocks, saveTimeBlocks, isConfirmed, triggerAutoSchedule]
  );

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const blockId = info.event.extendedProps?.blockId as string | undefined;
      if (blockId) {
        // Drag a time block
        if (!dailyPlanToday) {
          info.revert();
          return;
        }

        if (isConfirmed) {
          toast.error("Không thể di chuyển công việc cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
          info.revert();
          return;
        }

        const newStart = info.event.start;
        const newEnd = info.event.end;

        if (!newStart || !newEnd) {
          info.revert();
          return;
        }

        try {
          await updateTimeBlock(blockId, {
            startTime: toLocalISOString(newStart),
            endTime: toLocalISOString(newEnd),
          });
          toast.success("Đã cập nhật vị trí công việc!");
          triggerAutoSchedule();
        } catch {
          info.revert();
        }
        return;
      }

      // Drag a fixed event
      const occ = info.event.extendedProps.occurrence as FixedEventOccurrence | undefined;
      if (!occ) {
        info.revert();
        return;
      }

      if (isConfirmed) {
        toast.error("Không thể thay đổi sự kiện cố định cho ngày này (Kế hoạch đã chốt).");
        info.revert();
        return;
      }

      const newStart = info.event.start;
      if (!newStart) {
        info.revert();
        return;
      }

      const originalStartMs = occ.startTime ? new Date(`${occ.occurrenceDate}T${occ.startTime}`).getTime() : 0;
      const originalEndMs = occ.endTime ? new Date(`${occ.occurrenceDate}T${occ.endTime}`).getTime() : 0;
      const durationMs = originalEndMs > originalStartMs ? originalEndMs - originalStartMs : 60 * 60000;

      const newEnd = info.event.end || new Date(newStart.getTime() + durationMs);

      const pad = (n: number) => String(n).padStart(2, "0");
      const newDateStr = `${newStart.getFullYear()}-${pad(newStart.getMonth() + 1)}-${pad(newStart.getDate())}`;
      const newStartTimeStr = `${pad(newStart.getHours())}:${pad(newStart.getMinutes())}:00`;
      const newEndTimeStr = `${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}:00`;

      try {
        const categoryId = occ.categoryId ?? occ.category?.id ?? undefined;
        if (occ.recurrenceType === "NONE") {
          await updateAllOccurrences(occ.seriesId, {
            title: occ.title,
            notes: occ.notes || undefined,
            startTime: newStartTimeStr.substring(0, 5),
            endTime: newEndTimeStr.substring(0, 5),
            eventDate: newDateStr,
            recurrenceType: "NONE",
            categoryId,
          });
        } else {
          if (newDateStr !== occ.occurrenceDate) {
            await deleteSingleOccurrence(occ.seriesId, occ.occurrenceDate);
            await createEvent({
              title: occ.title,
              notes: occ.notes || undefined,
              startTime: newStartTimeStr.substring(0, 5),
              endTime: newEndTimeStr.substring(0, 5),
              eventDate: newDateStr,
              recurrenceType: "NONE",
              categoryId,
            });
          } else {
            await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, {
              overrideStartTime: newStartTimeStr,
              overrideEndTime: newEndTimeStr,
            });
          }
        }
        toast.success("Đã cập nhật sự kiện!");
        triggerAutoSchedule();
      } catch {
        info.revert();
      }
    },
    [
      dailyPlanToday,
      updateTimeBlock,
      updateSingleOccurrence,
      updateAllOccurrences,
      createEvent,
      deleteSingleOccurrence,
      isConfirmed,
      triggerAutoSchedule,
    ]
  );

  const handleEventResize = useCallback(
    async (info: EventResizeDoneArg) => {
      const blockId = info.event.extendedProps?.blockId as string | undefined;
      const occ = info.event.extendedProps?.occurrence as FixedEventOccurrence | undefined;

      if (!blockId && !occ) {
        info.revert();
        return;
      }

      if (isConfirmed) {
        toast.error("Không thể thay đổi thời lượng cho ngày này (Kế hoạch đã chốt).");
        info.revert();
        return;
      }

      const startTime = info.event.start;
      const endTime = info.event.end;
      if (!startTime || !endTime) {
        info.revert();
        return;
      }

      if (blockId) {
        try {
          await updateTimeBlock(blockId, {
            startTime: toLocalISOString(startTime),
            endTime: toLocalISOString(endTime),
            availabilityStatus: "BUSY"
          });
          
          // Optimistically update the task's estimatedMinutes in dailyPlan so the modal is instantly correct
          const taskId = info.event.extendedProps?.taskId as string | undefined;
          if (taskId && dailyPlanToday) {
            const startMs = startTime.getTime();
            const endMs = endTime.getTime();
            const durationMins = Math.round((endMs - startMs) / 60000);
            
            queryClient.setQueryData(['dailyPlan', dailyPlanToday.planDate], (old: DailyPlan | undefined) => {
              if (!old) return old;
              return {
                ...old,
                tasks: old.tasks.map(pt => pt.task.id === taskId ? {
                  ...pt,
                  task: { ...pt.task, estimatedMinutes: durationMins }
                } : pt)
              };
            });
          }

          queryClient.invalidateQueries({ queryKey: ['tasks'] }); 
          queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
          queryClient.invalidateQueries({ queryKey: ['dailyPlans'] });
          
          toast.success("Đã cập nhật thời lượng!");
          triggerAutoSchedule();
        } catch {
          info.revert();
          toast.error("Không thể cập nhật thời lượng.");
        }
      } else if (occ) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const newStartTimeStr = `${pad(startTime.getHours())}:${pad(startTime.getMinutes())}:00`;
        const newEndTimeStr = `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}:00`;

        try {
          const categoryId = occ.categoryId ?? occ.category?.id ?? undefined;
          if (occ.recurrenceType === "NONE") {
            await updateAllOccurrences(occ.seriesId, {
              title: occ.title,
              notes: occ.notes || undefined,
              startTime: newStartTimeStr.substring(0, 5),
              endTime: newEndTimeStr.substring(0, 5),
              eventDate: occ.occurrenceDate,
              recurrenceType: "NONE",
              categoryId,
            });
          } else {
            await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, {
              overrideStartTime: newStartTimeStr,
              overrideEndTime: newEndTimeStr,
            });
          }
          toast.success("Đã cập nhật thời lượng!");
          triggerAutoSchedule();
        } catch {
          info.revert();
          toast.error("Không thể cập nhật thời lượng.");
        }
      }
    },
    [dailyPlanToday, updateTimeBlock, updateAllOccurrences, updateSingleOccurrence, isConfirmed, triggerAutoSchedule, queryClient]
  );

  const handleEventDragStop = useCallback(
    (info: { event: { extendedProps: Record<string, unknown> }; jsEvent: MouseEvent }) => {
      if (!info.event.extendedProps.isTimeBlock || !sidebarRef.current) return;

      if (isConfirmed) {
        toast.error("Không thể hủy lịch cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
        return;
      }

      const rect = sidebarRef.current.getBoundingClientRect();
      const { clientX, clientY } = info.jsEvent;

      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        const taskId = info.event.extendedProps.taskId as string;
        handleUnscheduleTask(taskId);
      }
    },
    [handleUnscheduleTask, isConfirmed, sidebarRef]
  );

  return {
    handleEventReceive,
    handleEventDrop,
    handleEventResize,
    handleEventDragStop,
  };
}
