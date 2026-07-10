import { DailyPlanTask, TaskTimeBlock } from "../types";


interface ScheduleSlot {
  startTime: Date;
  endTime: Date;
}

export interface OccupiedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface QueueItem {
  planTask: DailyPlanTask;
  remainingMinutes: number;
  partsFilled: number;
  totalParts: number;
}

/**
 * Compute free time gaps between fixedEvents within [windowStart, windowEnd].
 * Returns gaps sorted by start time.
 */
function computeGaps(
  occupiedSlots: OccupiedSlot[],
  dateStr: string,
  windowStart: Date,
  windowEnd: Date
): ScheduleSlot[] {
  const occupied: ScheduleSlot[] = occupiedSlots
    .filter((slot) => slot.date === dateStr)
    .map((e) => {
      const [sh, sm] = e.startTime.split(":").map(Number);
      const [eh, em] = e.endTime.split(":").map(Number);
      const s = new Date(windowStart);
      s.setHours(sh, sm, 0, 0);
      const en = new Date(windowStart);
      en.setHours(eh, em, 0, 0);
      return { startTime: s, endTime: en };
    })
    .filter((s) => s.endTime > windowStart && s.startTime < windowEnd)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const gaps: ScheduleSlot[] = [];
  let cursor = windowStart;

  for (const occ of occupied) {
    const blockStart = occ.startTime < windowStart ? windowStart : occ.startTime;
    if (blockStart > cursor) {
      gaps.push({ startTime: new Date(cursor), endTime: new Date(blockStart) });
    }
    cursor = occ.endTime > cursor ? occ.endTime : cursor;
  }

  if (cursor < windowEnd) {
    gaps.push({ startTime: new Date(cursor), endTime: new Date(windowEnd) });
  }

  // Lọc chỉ giữ lại các gap có độ dài tối thiểu 30 phút
  return gaps.filter((g) => (g.endTime.getTime() - g.startTime.getTime()) >= 30 * 60 * 1000);
}

/**
 * Priority sort for tasks:
 * 1. Eisenhower quadrant (Q1 > Q2 > Q3 > Q4)
 * 2. Due date ascending (nulls last)
 * 3. Estimated duration descending
 */
function prioritySort(tasks: DailyPlanTask[]): DailyPlanTask[] {
  const quadrantOrder = (t: DailyPlanTask): number => {
    if (t.task.isUrgent && t.task.isImportant) return 0;  // Q1
    if (!t.task.isUrgent && t.task.isImportant) return 1; // Q2
    if (t.task.isUrgent && !t.task.isImportant) return 2; // Q3
    return 3;                                               // Q4
  };

  return [...tasks].sort((a, b) => {
    const qDiff = quadrantOrder(a) - quadrantOrder(b);
    if (qDiff !== 0) return qDiff;

    const aDate = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
    const bDate = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
    if (aDate !== bDate) return aDate - bDate;

    return (b.task.estimatedMinutes || 0) - (a.task.estimatedMinutes || 0);
  });
}

/**
 * Auto-Schedule algorithm with Time-Splitting.
 * Đảm bảo mọi time block được lên lịch có thời lượng tối thiểu là 30 phút.
 */
export function autoSchedule(
  planTasks: DailyPlanTask[],
  occupiedSlots: OccupiedSlot[],
  dailyPlanId: string,
  todayStr: string,
  wakeTimeStr: string,
  sleepTimeStr: string
): Omit<TaskTimeBlock, "id">[] {
  const now = new Date();
  const [wh, wm] = wakeTimeStr.split(":").map(Number);
  const [sh, sm] = sleepTimeStr.split(":").map(Number);

  const dayStart = new Date(now);
  dayStart.setHours(wh, wm, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(sh, sm, 0, 0);

  // Start from the later of "now" or "wake time", then add 15 minutes buffer
  let windowStart = now > dayStart ? now : dayStart;
  windowStart = new Date(windowStart.getTime() + 15 * 60 * 1000);

  if (windowStart >= dayEnd) return []; // No time left today

  const gaps = computeGaps(occupiedSlots, todayStr, windowStart, dayEnd);
  const sorted = prioritySort(planTasks);

  // Build queue with remaining minutes tracked per task
  const queue: QueueItem[] = sorted
    .filter((pt) => pt.task.estimatedMinutes && pt.task.estimatedMinutes > 0)
    .map((pt) => ({
      planTask: pt,
      remainingMinutes: pt.task.estimatedMinutes || 0,
      partsFilled: 0,
      totalParts: 1,
    }));

  const blocks: Omit<TaskTimeBlock, "id">[] = [];

  for (const gap of gaps) {
    if (queue.length === 0) break;

    let gapCursor = new Date(gap.startTime);

    while (gapCursor < gap.endTime && queue.length > 0) {
      const item = queue[0];
      const gapRemainingMs = gap.endTime.getTime() - gapCursor.getTime();
      const gapRemainingMin = Math.floor(gapRemainingMs / 60000);

      // Nếu gap còn lại ít hơn 30 phút, không thể xếp thêm bất kỳ block nào
      if (gapRemainingMin < 30) break;

      // Thời lượng cần xếp của task (áp dụng tối thiểu 30 phút)
      const taskMin = Math.max(30, item.remainingMinutes);

      if (taskMin <= gapRemainingMin) {
        // Task vừa khít hoặc nằm gọn trong gap
        const blockEnd = new Date(gapCursor.getTime() + taskMin * 60000);
        item.partsFilled += 1;
        item.totalParts = item.partsFilled;

        blocks.push({
          taskId: item.planTask.task.id,
          dailyPlanId,
          startTime: gapCursor.toISOString(),
          endTime: blockEnd.toISOString(),
          partIndex: item.partsFilled,
          totalParts: item.totalParts,
        });

        gapCursor = blockEnd;
        queue.shift();
      } else {
        // Task lớn hơn gap -> cắt lát
        // Chỉ cắt lát nếu phần xếp vào gap hiện tại (gapRemainingMin) lớn hơn hoặc bằng 30 phút
        if (gapRemainingMin >= 30) {
          item.partsFilled += 1;

          blocks.push({
            taskId: item.planTask.task.id,
            dailyPlanId,
            startTime: gapCursor.toISOString(),
            endTime: gap.endTime.toISOString(),
            partIndex: item.partsFilled,
            totalParts: 999, // sẽ được chuẩn hóa ở bước post-process
          });

          // Trừ đi thời lượng thực tế của task
          item.remainingMinutes = Math.max(0, item.remainingMinutes - gapRemainingMin);
          gapCursor = gap.endTime;
        } else {
          // Nếu gap còn lại không đủ 30 phút, dừng gap này
          break;
        }
      }
    }
  }

  // Post-process: chuẩn hóa totalParts cho các task bị phân mảnh
  const taskPartsMap: Record<string, number> = {};
  for (const b of blocks) {
    taskPartsMap[b.taskId] = Math.max(taskPartsMap[b.taskId] || 0, b.partIndex);
  }
  for (const b of blocks) {
    b.totalParts = taskPartsMap[b.taskId];
  }

  return blocks;
}
