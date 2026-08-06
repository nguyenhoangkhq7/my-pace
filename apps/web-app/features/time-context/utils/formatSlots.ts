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
  id: string;
  daysLabel: string;
  timeLabel: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  slots: TimeContextSlot[];
}

export function formatSlotGroups(slots: TimeContextSlot[]): FormattedSlotGroup[] {
  if (!slots || slots.length === 0) return [];

  // Group slots by time range (startTime-endTime)
  const groupsByTime: Record<string, { days: DayOfWeek[]; slots: TimeContextSlot[]; startTime: string; endTime: string }> = {};

  slots.forEach((s) => {
    const start5 = s.startTime.substring(0, 5);
    const end5 = s.endTime.substring(0, 5);
    const timeKey = `${start5} - ${end5}`;
    if (!groupsByTime[timeKey]) {
      groupsByTime[timeKey] = { days: [], slots: [], startTime: start5, endTime: end5 };
    }
    if (!groupsByTime[timeKey].days.includes(s.dayOfWeek)) {
      groupsByTime[timeKey].days.push(s.dayOfWeek);
    }
    groupsByTime[timeKey].slots.push(s);
  });

  const result: FormattedSlotGroup[] = [];

  Object.entries(groupsByTime).forEach(([timeLabel, data]) => {
    // Deduplicate and sort days chronologically (1..7)
    const uniqueDays = Array.from(new Set(data.days)).sort(
      (a, b) => DAY_ORDER[a] - DAY_ORDER[b]
    );

    let daysLabel = "";
    if (uniqueDays.length === 7) {
      daysLabel = "Hàng ngày";
    } else {
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

      daysLabel = blockLabels.join(", ");
    }

    result.push({
      id: `${timeLabel}_${uniqueDays.join("-")}`,
      daysLabel,
      timeLabel,
      days: uniqueDays,
      startTime: data.startTime,
      endTime: data.endTime,
      slots: data.slots,
    });
  });

  return result;
}
