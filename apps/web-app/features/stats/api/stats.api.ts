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
  getOverview: async (startDate?: string, endDate?: string): Promise<StatsOverviewResponse> => {
    let url = "stats/overview";
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }
    const response = await fetchClient.get<StatsOverviewResponse>(url);
    return response.data;
  },
};
