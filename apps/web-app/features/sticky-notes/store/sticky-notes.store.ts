import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StickyNoteColor } from "../types";

interface StickyNotesState {
  isManagerOpen: boolean;
  setIsManagerOpen: (open: boolean) => void;
  toggleManagerOpen: () => void;
  
  maxZIndex: number;
  incrementMaxZIndex: () => number;
  syncMaxZIndex: (notes: { zIndex?: number }[]) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  selectedColorFilter: StickyNoteColor | "all";
  setSelectedColorFilter: (color: StickyNoteColor | "all") => void;
}

export const useStickyNotesStore = create<StickyNotesState>()(
  persist(
    (set, get) => ({
      isManagerOpen: false,
      setIsManagerOpen: (open) => set({ isManagerOpen: open }),
      toggleManagerOpen: () => set((s) => ({ isManagerOpen: !s.isManagerOpen })),

      maxZIndex: 10,
      incrementMaxZIndex: () => {
        const next = get().maxZIndex + 1;
        set({ maxZIndex: next });
        return next;
      },
      syncMaxZIndex: (notes) => {
        if (!notes || notes.length === 0) return;
        const highest = Math.max(...notes.map((n) => n.zIndex || 0));
        if (highest >= get().maxZIndex) {
          set({ maxZIndex: highest + 1 });
        }
      },

      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      selectedColorFilter: "all",
      setSelectedColorFilter: (color) => set({ selectedColorFilter: color }),
    }),
    {
      name: "my-pace-sticky-notes-store",
      partialize: (state) => ({
        maxZIndex: state.maxZIndex,
      }),
    }
  )
);
