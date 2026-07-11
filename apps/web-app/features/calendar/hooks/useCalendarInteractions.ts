import { useCallback } from "react";
import { toast } from "sonner";
import type { EventDropArg } from "@fullcalendar/core";
import type { EventReceiveArg } from "@fullcalendar/interaction";
import type { FixedEventOccurrence, CreateEventPayload, UpdateOccurrencePayload } from "@/features/calendar/types";
import type { DailyPlan, TaskTimeBlock } from "@/features/board/types";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

interface UseCalendarInteractionsProps {
  dailyPlanToday: DailyPlan | null;
  timeBlocks: TaskTimeBlock[];
  saveTimeBlocks: (blocks: Omit<TaskTimeBlock, 'id'>[]) => Promise<unknown>;
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
  saveTimeBlocks,
  updateAllOccurrences,
  updateSingleOccurrence,
  createEvent,
  deleteSingleOccurrence,
  handleUnscheduleTask,
  sidebarRef,
}: UseCalendarInteractionsProps) {
  // ── When task dropped from sidebar → save as new time block ──────────────
  const handleEventReceive = useCallback(
    async (info: EventReceiveArg) => {
      const taskId = info.event.extendedProps?.taskId as string | undefined;
      const planTask = dailyPlanToday?.tasks.find((pt) => pt.task.id === taskId);
      if (!taskId || !planTask || !dailyPlanToday) {
        info.revert();
        return;
      }

      const startTime = info.event.start;
      const endTime = info.event.end;
      if (!startTime || !endTime) {
        info.revert();
        return;
      }

      const droppedDate = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
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
        dailyPlanId: dailyPlanToday.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        partIndex: 1,
        totalParts: 1,
      };

      try {
        await saveTimeBlocks([...existingBlocks, newBlock]);
        toast.success(`Đã lên lịch: "${planTask.task.title}"`);
        // Advance tour if user just completed the drag-drop step (step index 9)
        const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore.getState();
        if (isTourActive && tourStepIndex === 9) {
          setTimeout(() => advanceTourStep(), 500);
        }
      } catch {
        info.revert();
        toast.error("Không thể lưu lịch.");
      }
    },
    [dailyPlanToday, timeBlocks, saveTimeBlocks]
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
          if (occ.recurrenceType === "NONE") {
            // A single, non-recurring event: update the series eventDate and times directly
            await updateAllOccurrences(occ.seriesId, {
              title: occ.title,
              notes: occ.notes || undefined,
              startTime: newStartTime.substring(0, 5),
              endTime: newEndTime.substring(0, 5),
              eventDate: newDate,
              recurrenceType: "NONE",
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
      const startTime = info.event.start;
      const endTime = info.event.end;
      if (!startTime || !endTime) {
        info.revert();
        return;
      }

      const droppedDate = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      if (droppedDate !== dailyPlanToday.planDate) {
        toast.error(`Chỉ được phép dời lịch trong ngày của kế hoạch (${dailyPlanToday.planDate})`);
        info.revert();
        return;
      }

      const updatedBlocks = timeBlocks
        .map((b) =>
          b.id === blockId ? { ...b, startTime: startTime.toISOString(), endTime: endTime.toISOString() } : b
        )
        .map((b) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _, ...rest } = b;
          return rest;
        });

      try {
        await saveTimeBlocks(updatedBlocks);
        toast.success("Đã cập nhật lịch!");
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
        const updatedBlocks = timeBlocks
          .map((b) => (b.id === blockId ? { ...b, endTime: newEnd.toISOString() } : b))
          .map((b) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _, ...rest } = b;
            return rest;
          });
        try {
          await saveTimeBlocks(updatedBlocks);
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
        if (occ.recurrenceType === "NONE") {
          await updateAllOccurrences(occ.seriesId, {
            title: occ.title,
            notes: occ.notes || undefined,
            startTime: occ.startTime.substring(0, 5),
            endTime: newEndTime.substring(0, 5),
            eventDate: occ.occurrenceDate,
            recurrenceType: "NONE",
          });
        } else {
          await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, { overrideEndTime: newEndTime });
        }
      } catch {
        arg.revert();
      }
    },
    [dailyPlanToday, timeBlocks, saveTimeBlocks, updateSingleOccurrence, updateAllOccurrences]
  );

  const handleEventDragStop = useCallback(
    (info: { event: { extendedProps: Record<string, unknown> }; jsEvent: MouseEvent }) => {
      if (!info.event.extendedProps.isTimeBlock || !sidebarRef.current) return;

      const rect = sidebarRef.current.getBoundingClientRect();
      const x = info.jsEvent.clientX;
      const y = info.jsEvent.clientY;

      // Check if drop coordinate is inside sidebar bounding box
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const taskId = info.event.extendedProps.taskId as string;
        handleUnscheduleTask(taskId);
      }
    },
    [handleUnscheduleTask, sidebarRef]
  );

  return { handleEventReceive, handleEventDrop, handleEventResize, handleEventDragStop };
}
