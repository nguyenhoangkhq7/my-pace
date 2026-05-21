import { create } from "zustand";
import type { TaskItem, TaskStatus } from "@/features/todos/types";

interface FilterState {
  /** null = show all categories */
  selectedCategoryId: number | null;
  setCategory: (id: number | null) => void;
  activeView: string;
  setActiveView: (view: string) => void;

  // New Item Modal global state
  isNewItemModalOpen: boolean;
  defaultTaskStatus: TaskStatus | null;
  setIsNewItemModalOpen: (open: boolean, defaultStatus?: TaskStatus | null) => void;

  // Task Detail Modal global state
  taskDetailTask: TaskItem | null;
  setTaskDetailTask: (task: TaskItem | null) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedCategoryId: null,
  setCategory: (id) => set({ selectedCategoryId: id }),
  activeView: "matrix",
  setActiveView: (view) => set({ activeView: view }),

  isNewItemModalOpen: false,
  defaultTaskStatus: null,
  setIsNewItemModalOpen: (open, defaultStatus = null) =>
    set({ isNewItemModalOpen: open, defaultTaskStatus: defaultStatus }),

  taskDetailTask: null,
  setTaskDetailTask: (task) => set({ taskDetailTask: task }),
}));

