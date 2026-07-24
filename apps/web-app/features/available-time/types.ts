export interface AvailableTimeData {
  availableMinutes: number;
  blockedMinutes: number;
  bufferPct: number;
  workingWindowMinutes: number;
  checkedIn: boolean;
  checkinTime: string | null;
  streak: number;
  blockedIntervals?: { startTime: string; endTime: string }[];
  isPlanConfirmed?: boolean;
}
