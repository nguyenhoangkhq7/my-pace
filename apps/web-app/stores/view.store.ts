import { create } from "zustand";

type ViewState = {
  activeView: string;
  setActiveView: (view: string) => void;
};

export const useViewStore = create<ViewState>((set) => ({
  activeView: "matrix",
  setActiveView: (view) => set({ activeView: view }),
}));

