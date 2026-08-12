import type { TaskTimeBlock } from "../types";
import { format, parseISO, addMinutes } from "date-fns";

/**
 * Shifts subsequent time blocks when a task is completed early or late.
 *
 * @param timeBlocks The list of all time blocks for the daily plan.
 * @param completedTaskId The ID of the task that was completed.
 * @param actualMinutes The actual minutes taken.
 * @param estimatedMinutes The estimated/planned minutes.
 * @returns The updated list of time blocks.
 */
export function shiftTimeBlocks(
  timeBlocks: TaskTimeBlock[],
  completedTaskId: string,
  actualMinutes: number,
  estimatedMinutes: number
): Omit<TaskTimeBlock, "id">[] {
  const stripId = (tb: TaskTimeBlock): Omit<TaskTimeBlock, "id"> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = tb;
    return rest;
  };

  const diff = actualMinutes - estimatedMinutes;
  if (diff === 0) {
    return timeBlocks.map(stripId);
  }

  // Sort blocks by start time
  const sortedBlocks = [...timeBlocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Find the last block of the completed task
  let completedLastIndex = -1;
  for (let i = sortedBlocks.length - 1; i >= 0; i--) {
    if (sortedBlocks[i].taskId === completedTaskId) {
      completedLastIndex = i;
      break;
    }
  }

  if (completedLastIndex === -1) {
    // Task has no time blocks, return as is
    return timeBlocks.map(stripId);
  }

  // Format helper to preserve local date-time string style
  const formatLocalISO = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
  };

  const updatedBlocks = sortedBlocks.map((block, idx) => {
    const rest = stripId(block);
    const start = parseISO(block.startTime);
    const end = parseISO(block.endTime);

    if (idx === completedLastIndex) {
      // Adjust the end time of the completed task's last block
      const newEnd = addMinutes(end, diff);
      return {
        ...rest,
        endTime: formatLocalISO(newEnd),
      };
    } else if (idx > completedLastIndex) {
      // Shift all subsequent blocks
      const newStart = addMinutes(start, diff);
      const newEnd = addMinutes(end, diff);
      return {
        ...rest,
        startTime: formatLocalISO(newStart),
        endTime: formatLocalISO(newEnd),
      };
    }
    
    // Blocks before completed block remain unchanged
    return {
      ...rest,
      startTime: formatLocalISO(start),
      endTime: formatLocalISO(end),
    };
  });

  return updatedBlocks;
}
