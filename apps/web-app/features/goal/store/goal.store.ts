import { create } from "zustand";
import { Goal, GoalCreateRequest, GoalUpdateRequest } from "../types";
import { goalApi } from "../api/goal.api";
import { getApiErrorMessage } from "@/lib/fetchClient";

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (request: GoalCreateRequest) => Promise<Goal>;
  updateGoal: (id: string, request: GoalUpdateRequest) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await goalApi.getGoals();
      set({ goals: res.data });
    } catch (err) {
      set({ error: getApiErrorMessage(err) });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  createGoal: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const res = await goalApi.createGoal(request);
      set((state) => ({ goals: [...state.goals, res.data] }));
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), isLoading: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateGoal: async (id, request) => {
    set({ isLoading: true, error: null });
    try {
      const res = await goalApi.updateGoal(id, request);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? res.data : g)),
      }));
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), isLoading: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await goalApi.deleteGoal(id);
      // Instead of optimistically removing, it's safer to re-fetch because it might be a soft-delete (status changed to Archived)
      await get().fetchGoals();
    } catch (err) {
      set({ error: getApiErrorMessage(err), isLoading: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
