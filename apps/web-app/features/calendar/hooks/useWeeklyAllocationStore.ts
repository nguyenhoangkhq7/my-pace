import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeeklyAllocationSummary } from '@/features/calendar/types';

interface WeeklyAllocationState {
  summary: WeeklyAllocationSummary | null;
  setSummary: (summary: WeeklyAllocationSummary) => void;
  clearSummary: () => void;
}

export const useWeeklyAllocationStore = create<WeeklyAllocationState>()(
  persist(
    (set) => ({
      summary: null,
      setSummary: (summary) => set({ summary }),
      clearSummary: () => set({ summary: null }),
    }),
    {
      name: 'weekly-allocation-storage', // persists in localStorage
    }
  )
);
