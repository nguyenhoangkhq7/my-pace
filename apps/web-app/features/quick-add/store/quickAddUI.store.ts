import { create } from "zustand";

interface QuickAddUIState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useQuickAddUIStore = create<QuickAddUIState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
