import type { DayOfWeek, TimeContextSlot } from "../types";

const DAY_ORDER: Record<DayOfWeek, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};

export interface FormattedSlotGroup {
  daysLabel: string;
  timeLabel: string;
}

export function formatSlotGroups(slots: TimeContextSlot[]): FormattedSlotGroup[] {
  if (!slots || slots.length === 0) return [];

  // Group slots by time range (startTime-endTime)
  const groupsByTime: Record<string, DayOfWeek[]> = {};

  slots.forEach((s) => {
    const timeKey = `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`;
    if (!groupsByTime[timeKey]) {
      groupsByTime[timeKey] = [];
    }
    if (!groupsByTime[timeKey].includes(s.dayOfWeek)) {
      groupsByTime[timeKey].push(s.dayOfWeek);
    }
  });

  const result: FormattedSlotGroup[] = [];

  Object.entries(groupsByTime).forEach(([timeLabel, days]) => {
    // Deduplicate and sort days chronologically (1..7)
    const uniqueDays = Array.from(new Set(days)).sort(
      (a, b) => DAY_ORDER[a] - DAY_ORDER[b]
    );

    if (uniqueDays.length === 7) {
      result.push({ daysLabel: "Hàng ngày", timeLabel });
      return;
    }

    // Split uniqueDays into consecutive sub-blocks
    const blocks: DayOfWeek[][] = [];
    let currentBlock: DayOfWeek[] = [uniqueDays[0]];

    for (let i = 1; i < uniqueDays.length; i++) {
      const prevDay = uniqueDays[i - 1];
      const currDay = uniqueDays[i];

      if (DAY_ORDER[currDay] === DAY_ORDER[prevDay] + 1) {
        currentBlock.push(currDay);
      } else {
        blocks.push(currentBlock);
        currentBlock = [currDay];
      }
    }
    blocks.push(currentBlock);

    // Format each block into label text
    const blockLabels = blocks.map((block) => {
      if (block.length >= 3) {
        return `${DAY_LABELS[block[0]]} - ${DAY_LABELS[block[block.length - 1]]}`;
      } else {
        return block.map((d) => DAY_LABELS[d]).join(", ");
      }
    });

    result.push({
      daysLabel: blockLabels.join(", "),
      timeLabel,
    });
  });

  return result;
}
