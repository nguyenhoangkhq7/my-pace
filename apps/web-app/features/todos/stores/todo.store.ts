import { create } from "zustand";
import type { Category, BoardTask } from "../types/todo.type";
import type { CalendarEvent } from "@/features/calendar";

interface TodoStoreState {
  tasks: BoardTask[];
  categories: Category[];
  events: CalendarEvent[];
  notes: string;
  loading: boolean;
  error: string | null;

  setTasks: (tasks: BoardTask[]) => void;
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
