import { create } from "zustand";

interface GoalState {
  _placeholder?: string;
}

export const useGoalStore = create<GoalState>(() => ({
}));
