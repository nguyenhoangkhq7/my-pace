import { create } from "zustand";

type CategoryFilterState = {
  selectedCategoryId: number | null;
  setCategory: (id: number | null) => void;
};

export const useCategoryFilterStore = create<CategoryFilterState>((set) => ({
  selectedCategoryId: null,
  setCategory: (id) => set({ selectedCategoryId: id }),
}));

