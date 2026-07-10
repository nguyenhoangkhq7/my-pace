import { create } from "zustand";
import { statsApi, StatsOverviewResponse } from "../api/stats.api";
import { getApiErrorMessage } from "@/lib/fetchClient";

interface StatsState {
  overview: StatsOverviewResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchOverview: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  overview: null,
  isLoading: false,
  error: null,
  fetchOverview: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await statsApi.getOverview(startDate, endDate);
      set({ overview: data, isLoading: false });
    } catch (error) {
      set({ 
        error: getApiErrorMessage(error, "Failed to fetch stats"), 
        isLoading: false 
      });
    }
  },
}));
