import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ViewState = {
  activeView: string;
  setActiveView: (view: string) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      activeView: "matrix",
      setActiveView: (view) => set({ activeView: view }),
      isExpanded: true,
      setIsExpanded: (isExpanded) => set({ isExpanded }),
    }),
    {
      name: "todos-view-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isExpanded: state.isExpanded }),
    }
  )
);

