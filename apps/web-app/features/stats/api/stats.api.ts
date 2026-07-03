import { fetchClient } from "@/lib/fetchClient";

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

export const statsApi = {
  getOverview: async (): Promise<StatsOverviewResponse> => {
    const response = await fetchClient.get<StatsOverviewResponse>("stats/overview");
    return response.data;
  },
};
