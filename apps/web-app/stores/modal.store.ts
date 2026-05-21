import { create } from "zustand";
import type { TaskItem, TaskStatus } from "@/features/todos/types";

type ModalState = {
  isNewItemModalOpen: boolean;
  defaultTaskStatus: TaskStatus | null;
  setIsNewItemModalOpen: (open: boolean, defaultStatus?: TaskStatus | null) => void;
  taskDetailTask: TaskItem | null;
  setTaskDetailTask: (task: TaskItem | null) => void;
};

export const useModalStore = create<ModalState>((set) => ({
  isNewItemModalOpen: false,
  defaultTaskStatus: null,
  setIsNewItemModalOpen: (open, defaultStatus = null) =>
    set({ isNewItemModalOpen: open, defaultTaskStatus: defaultStatus }),
  taskDetailTask: null,
  setTaskDetailTask: (task) => set({ taskDetailTask: task }),
}));

