import { create } from "zustand";
import type { CalendarEvent, Category, TaskItem } from "@/features/todos/types";

interface TodoStoreState {
  tasks: TaskItem[];
  categories: Category[];
  events: CalendarEvent[];
  notes: string;
  loading: boolean;
  error: string | null;

  setTasks: (tasks: TaskItem[]) => void;
  setCategories: (categories: Category[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  setNotes: (notes: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTodoStore = create<TodoStoreState>((set) => ({
  tasks: [],
  categories: [],
  events: [],
  notes: "",
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setCategories: (categories) => set({ categories }),
  setEvents: (events) => set({ events }),
  setNotes: (notes) => set({ notes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
