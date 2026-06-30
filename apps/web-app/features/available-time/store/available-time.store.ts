import { create } from "zustand";
import type { AvailableTimeData } from "../types";
import { availableTimeApi } from "../api/available-time.api";

interface AvailableTimeState {
  data: AvailableTimeData | null;
  isLoading: boolean;
  setData: (data: AvailableTimeData | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  fetchAvailableTime: (date: string) => Promise<void>;
  checkin: (date: string, checkinTime?: string) => Promise<void>;
}

export const useAvailableTimeStore = create<AvailableTimeState>((set) => ({
  data: null,
  isLoading: false,
  setData: (data) => set({ data }),
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchAvailableTime: async (date) => {
    set({ isLoading: true });
    try {
      const res = await availableTimeApi.getAvailableTime(date);
      set({ data: res.data });
    } catch (err) {
      console.error("Failed to fetch available time", err);
    } finally {
      set({ isLoading: false });
    }
  },

  checkin: async (date, checkinTime) => {
    set({ isLoading: true });
    try {
      const res = await availableTimeApi.checkin(date, checkinTime);
      set({ data: res.data });
    } catch (err) {
      console.error("Failed to record checkin", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
