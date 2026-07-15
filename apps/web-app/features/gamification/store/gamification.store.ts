import { create } from "zustand";

interface GamificationState {
  streakToCelebrate: number | null;
  setStreakToCelebrate: (streak: number | null) => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  streakToCelebrate: null,
  setStreakToCelebrate: (streak) => set({ streakToCelebrate: streak }),
}));
