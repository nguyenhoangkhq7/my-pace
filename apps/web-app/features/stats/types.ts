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
}
