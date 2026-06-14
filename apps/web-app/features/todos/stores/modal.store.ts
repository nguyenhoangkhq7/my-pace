import { create } from "zustand";
import type { BoardTask, TaskStatus } from "../types/todo.type";

type ModalState = {
  isNewItemModalOpen: boolean;
  defaultTaskStatus: TaskStatus | null;
  setIsNewItemModalOpen: (open: boolean, defaultStatus?: TaskStatus | null) => void;
  taskDetailTask: BoardTask | null;
  setTaskDetailTask: (task: BoardTask | null) => void;
};

export const useModalStore = create<ModalState>((set) => ({
  isNewItemModalOpen: false,
  defaultTaskStatus: null,
  setIsNewItemModalOpen: (open, defaultStatus = null) =>
    set({ isNewItemModalOpen: open, defaultTaskStatus: defaultStatus }),
  taskDetailTask: null,
  setTaskDetailTask: (task) => set({ taskDetailTask: task }),
}));

