import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuickAddUIState {
  isOpen: boolean;
  autoConfirm: boolean;
  open: () => void;
  close: () => void;
  setAutoConfirm: (autoConfirm: boolean) => void;
  toggleAutoConfirm: () => void;
}

export const useQuickAddUIStore = create<QuickAddUIState>()(
  persist(
    (set) => ({
      isOpen: false,
      autoConfirm: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setAutoConfirm: (autoConfirm) => set({ autoConfirm }),
      toggleAutoConfirm: () => set((state) => ({ autoConfirm: !state.autoConfirm })),
    }),
    {
      name: "my-pace-quickadd-settings",
      partialize: (state) => ({ autoConfirm: state.autoConfirm }),
    }
  )
);
