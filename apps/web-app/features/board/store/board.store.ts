import { create } from "zustand";
import { Task } from "../types";

interface BoardClientState {
  selectedFilterId: string | null;
  isStarted: boolean;
  isPlanningMode: boolean;
  planningTarget: string | null;
  plannedTaskIds: string[];

  editingTask: Task | null;
  isTaskModalOpen: boolean;
  prefilledGoalId: string | null;
  requireDuration: boolean;

  setFilter: (categoryId: string | null) => void;
  setPlanningMode: (isPlanning: boolean, target?: string, initialTaskIds?: string[]) => void;
  addPlannedTaskLocally: (task: Task) => void;
  removePlannedTaskLocally: (taskId: string) => void;

  openTaskModal: (task?: Task | null, prefilledGoalId?: string | null, requireDuration?: boolean) => void;
  closeTaskModal: () => void;
}

export const useBoardStore = create<BoardClientState>((set) => ({
  selectedFilterId: null,
  isStarted: false,
  isPlanningMode: false,
  planningTarget: null,
  plannedTaskIds: [],

  editingTask: null,
  isTaskModalOpen: false,
  prefilledGoalId: null,
  requireDuration: false,

  setFilter: (categoryId) => set({ selectedFilterId: categoryId }),

  setPlanningMode: (isPlanning, target = 'today', initialTaskIds = []) => {
    set({
      isPlanningMode: isPlanning,
      planningTarget: isPlanning ? target : null,
      plannedTaskIds: isPlanning ? initialTaskIds : []
    });
  },

  addPlannedTaskLocally: (task) => {
    set(state => {
      if (!state.plannedTaskIds.includes(task.id)) {
        return { plannedTaskIds: [...state.plannedTaskIds, task.id] };
      }
      return state;
    });
  },

  removePlannedTaskLocally: (taskId) => {
    set(state => ({
      plannedTaskIds: state.plannedTaskIds.filter(id => id !== taskId)
    }));
  },

  openTaskModal: (task = null, prefilledGoalId = null, requireDuration = false) => {
    set({
      editingTask: task,
      isTaskModalOpen: true,
      prefilledGoalId,
      requireDuration
    });
  },

  closeTaskModal: () => {
    set({
      editingTask: null,
      isTaskModalOpen: false,
      prefilledGoalId: null,
      requireDuration: false
    });
  }
}));
