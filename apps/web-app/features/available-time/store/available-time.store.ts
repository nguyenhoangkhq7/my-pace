import { create } from "zustand";
import type { AvailableTimeData } from "../types";
import { availableTimeApi } from "../api/available-time.api";

interface AvailableTimeState {
  dataToday: AvailableTimeData | null;
  dataTomorrow: AvailableTimeData | null;
  isLoading: boolean;
  fetchAvailableTimeToday: (date: string) => Promise<void>;
  fetchAvailableTimeTomorrow: (date: string) => Promise<void>;
  checkin: (date: string, checkinTime?: string) => Promise<void>;
}

export const useAvailableTimeStore = create<AvailableTimeState>((set) => ({
  dataToday: null,
  dataTomorrow: null,
  isLoading: false,

  fetchAvailableTimeToday: async (date) => {
    set({ isLoading: true });
    try {
      const res = await availableTimeApi.getAvailableTime(date);
      set({ dataToday: res.data });
    } catch (err) {
      console.error("Failed to fetch available time today", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAvailableTimeTomorrow: async (date) => {
    try {
      const res = await availableTimeApi.getAvailableTime(date);
      set({ dataTomorrow: res.data });
    } catch (err) {
      console.error("Failed to fetch available time tomorrow", err);
    }
  },

  checkin: async (date, checkinTime) => {
    set({ isLoading: true });
    try {
      const res = await availableTimeApi.checkin(date, checkinTime);
      set({ dataToday: res.data });
    } catch (err) {
      console.error("Failed to record checkin", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
