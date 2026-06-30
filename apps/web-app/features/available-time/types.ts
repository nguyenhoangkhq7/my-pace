export interface AvailableTimeData {
  availableMinutes: number;
  blockedMinutes: number;
  bufferPct: number;
  workingWindowMinutes: number;
  checkedIn: boolean;
  checkinTime: string | null;
}
