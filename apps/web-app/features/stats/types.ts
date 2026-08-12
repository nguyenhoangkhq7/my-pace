export interface DailyTimeStat {
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
}

export interface StatsOverviewResponse {
  matrixTime: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  categoryTime: Record<string, number>;
  completionRate: number;
  streak: number;
  totalPlannedMinutes?: number;
  totalActualMinutes?: number;
  estimationAccuracy?: number;
  q2FocusRatio?: number;
  rolloverRate?: number;
  dailyTimeStats?: DailyTimeStat[];
  /** Focus minutes aggregated by hour-of-day (key = 0-23, value = total minutes). */
  hourlyFocusMinutes?: Record<number, number>;
}


