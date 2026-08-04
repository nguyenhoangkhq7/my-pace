import { useCallback } from "react";
import { toast } from "sonner";
import type { EventDropArg } from "@fullcalendar/core";
import type { EventReceiveArg } from "@fullcalendar/interaction";
import type { FixedEventOccurrence, CreateEventPayload, UpdateOccurrencePayload } from "@/features/calendar/types";
import type { DailyPlan, TaskTimeBlock } from "@/features/board/types";
import { toLocalISOString } from "@/lib/date";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
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

  // ── When task dropped from sidebar → save as new time block ──────────────
  const handleEventReceive = useCallback(
    async (info: EventReceiveArg) => {
      const taskId = info.event.extendedProps?.taskId as string | undefined;
      const planTask = dailyPlanToday?.tasks.find((pt) => pt.task.id === taskId);
      if (!taskId || !planTask || !dailyPlanToday) {
        info.revert();
        return;
      }

      if (isConfirmed) {
        toast.error("Không thể xếp lịch cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
        info.revert();
        return;
      }

      const startTime = info.event.start;
      const endTime = info.event.end;
      if (!startTime || !endTime) {
        info.revert();
        return;
      }

      const droppedDate = toLocalISOString(startTime).split("T")[0];
      if (droppedDate !== dailyPlanToday.planDate) {
        toast.error(`Chỉ được phép xếp lịch vào ngày của kế hoạch (${dailyPlanToday.planDate})`);
        info.revert();
        return;
      }

      // Remove any existing blocks for this task (1 manual placement = 1 block)
      const existingBlocks = timeBlocks
        .filter((b) => b.taskId !== taskId)
        .map((b) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _, ...rest } = b;
          return rest;
        });

      const newBlock = {
        taskId,
        startTime: toLocalISOString(startTime),
        endTime: toLocalISOString(endTime),
        partIndex: 1,
        totalParts: 1,
        availabilityStatus: "BUSY" as const,
      };

      try {
        await saveTimeBlocks([...existingBlocks, newBlock]);
        toast.success(`Đã lên lịch: "${planTask.task.title}"`);
        triggerAutoSchedule();
      } catch {
        info.revert();
        toast.error("Không thể lưu lịch.");
      }
    },
    [dailyPlanToday, timeBlocks, saveTimeBlocks, isConfirmed]
  );

  // ── When a time block is moved on the calendar ────────────────────────────
  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const blockId = info.event.extendedProps?.blockId as string | undefined;
      // If it's a fixed event (no blockId), handle old logic
      if (!blockId) {
        const occ = info.event.extendedProps.occurrence as FixedEventOccurrence | undefined;
        if (!occ) {
          info.revert();
          return;
        }
        const newStart = info.event.start;
        const newEnd = info.event.end;
        if (!newStart || !newEnd) {
          info.revert();
          return;
        }

        // Timezone-safe local date string format (YYYY-MM-DD)
        const newDate = `${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, "0")}-${String(
          newStart.getDate()
        ).padStart(2, "0")}`;
        const newStartTime = `${String(newStart.getHours()).padStart(2, "0")}:${String(newStart.getMinutes()).padStart(
          2,
          "0"
        )}:00`;
        const newEndTime = `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(
          2,
          "0"
        )}:00`;

        try {
          const categoryId = occ.categoryId ?? occ.category?.id ?? undefined;
          if (occ.recurrenceType === "NONE") {
            // A single, non-recurring event: update the series eventDate and times directly
            await updateAllOccurrences(occ.seriesId, {
              title: occ.title,
              notes: occ.notes || undefined,
              startTime: newStartTime.substring(0, 5),
              endTime: newEndTime.substring(0, 5),
              eventDate: newDate,
              recurrenceType: "NONE",
              categoryId,
            });
            toast.success("Đã di chuyển sự kiện!");
          } else {
            // A recurring event occurrence
            if (newDate !== occ.occurrenceDate) {
              // Moved to a different day: soft-delete this occurrence and create a new standalone event
              await deleteSingleOccurrence(occ.seriesId, occ.occurrenceDate);
              await createEvent({
                title: occ.title,
                notes: occ.notes || undefined,
                startTime: newStartTime.substring(0, 5),
                endTime: newEndTime.substring(0, 5),
                eventDate: newDate,
                recurrenceType: "NONE",
                categoryId,
              });
              toast.success("Đã dời lịch sự kiện sang ngày mới!");
            } else {
              // Moved within the same day: just update times via single occurrence exception
              await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, {
                overrideStartTime: newStartTime,
                overrideEndTime: newEndTime,
              });
              toast.success("Đã cập nhật giờ sự kiện!");
            }
          }
        } catch (err) {
          console.error("Failed to move calendar event", err);
          info.revert();
          toast.error("Không thể di chuyển sự kiện.");
        }
        return;
      }

      if (!dailyPlanToday) {
        info.revert();
        return;
      }

      if (isConfirmed) {
        toast.error("Không thể di chuyển công việc cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
        info.revert();
        return;
      }
      const startTime = info.event.start;
      const endTime = info.event.end;
      if (!startTime || !endTime) {
        info.revert();
        return;
      }

      const droppedDate = toLocalISOString(startTime).split("T")[0];
      if (droppedDate !== dailyPlanToday.planDate) {
        toast.error(`Chỉ được phép dời lịch trong ngày của kế hoạch (${dailyPlanToday.planDate})`);
        info.revert();
        return;
      }

      try {
        await updateTimeBlock(blockId, {
          startTime: toLocalISOString(startTime),
          endTime: toLocalISOString(endTime),
          availabilityStatus: "BUSY"
        });
        toast.success("Đã cập nhật lịch!");
        triggerAutoSchedule();
      } catch {
        info.revert();
      }
    },
    [
      dailyPlanToday,
      timeBlocks,
      saveTimeBlocks,
      updateSingleOccurrence,
      updateAllOccurrences,
      createEvent,
      deleteSingleOccurrence,
      isConfirmed,
    ]
  );

  const handleEventResize = useCallback(
    async (arg: { event: { end: Date | null; extendedProps: Record<string, unknown> }; revert: () => void }) => {
      const blockId = arg.event.extendedProps?.blockId as string | undefined;
      if (blockId) {
        // Resize a time block
        const newEnd = arg.event.end;
        if (!newEnd || !dailyPlanToday) {
          arg.revert();
          return;
        }

        if (isConfirmed) {
          toast.error("Không thể kéo giãn công việc cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
          arg.revert();
          return;
        }

        const block = timeBlocks.find((b) => b.id === blockId);
        if (!block) {
          arg.revert();
          return;
        }
        const startTime = new Date(block.startTime);
        const endTime = new Date(toLocalISOString(newEnd));
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        try {
          await updateTimeBlock(blockId, {
            endTime: toLocalISOString(newEnd)
          });
          if (durationMinutes > 0) {
            await fetchClient.put(`tasks/${block.taskId}`, { estimatedMinutes: durationMinutes });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
          }
          toast.success("Đã cập nhật lịch trình và thời lượng công việc!");
          triggerAutoSchedule();
        } catch {
          arg.revert();
        }
        return;
      }
      // Resize a fixed event
      const occ = arg.event.extendedProps.occurrence as FixedEventOccurrence | undefined;
      if (!occ) {
        arg.revert();
        return;
      }
      const newEnd = arg.event.end as Date | null;
      if (!newEnd) {
        arg.revert();
        return;
      }
      const newEndTime = `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(
        2,
        "0"
      )}:00`;
      try {
        const categoryId = occ.categoryId ?? occ.category?.id ?? undefined;
        if (occ.recurrenceType === "NONE") {
          await updateAllOccurrences(occ.seriesId, {
            title: occ.title,
            notes: occ.notes || undefined,
            startTime: occ.startTime.substring(0, 5),
            endTime: newEndTime.substring(0, 5),
            eventDate: occ.occurrenceDate,
            recurrenceType: "NONE",
            categoryId,
          });
        } else {
          await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, { overrideEndTime: newEndTime });
        }
      } catch {
        arg.revert();
      }
    },
    [dailyPlanToday, timeBlocks, saveTimeBlocks, updateSingleOccurrence, updateAllOccurrences, queryClient, isConfirmed]
  );

  const handleEventDragStop = useCallback(
    (info: { event: { extendedProps: Record<string, unknown> }; jsEvent: MouseEvent }) => {
      if (!info.event.extendedProps.isTimeBlock || !sidebarRef.current) return;

      if (isConfirmed) {
        toast.error("Không thể hủy lịch cho ngày này (Kế hoạch đã chốt hoặc không cho phép chỉnh sửa).");
        return;
      }

      const rect = sidebarRef.current.getBoundingClientRect();
      const x = info.jsEvent.clientX;
      const y = info.jsEvent.clientY;

      // Check if drop coordinate is inside sidebar bounding box
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const taskId = info.event.extendedProps.taskId as string;
        handleUnscheduleTask(taskId);
      }
    },
    [handleUnscheduleTask, sidebarRef, isConfirmed]
  );

  return { handleEventReceive, handleEventDrop, handleEventResize, handleEventDragStop };
}
