import { create } from "zustand";
import { fetchClient } from "@/lib/fetchClient";
import type { Category, TaskItem, CalendarEvent, TaskStatus } from "@/features/todos/types";

interface TodoStoreState {
  tasks: TaskItem[];
  categories: Category[];
  events: CalendarEvent[];
  notes: string;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchNotes: () => Promise<void>;

  createTask: (taskData: Partial<TaskItem> & { description?: string }) => Promise<void>;
  createCategory: (name: string, preferredStartTime?: string, preferredEndTime?: string) => Promise<void>;
  updateTaskStatus: (id: number, status: TaskStatus) => Promise<void>;
  toggleTaskDone: (id: number, isDone: boolean) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
}

export const useTodoStore = create<TodoStoreState>((set, get) => ({
  tasks: [],
  categories: [],
  events: [],
  notes: "",
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetchClient.get<Category[]>("categories");
      set({ categories: res.data || [] });
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      set({ error: err.message || "Failed to fetch categories" });
    } finally {
      set({ loading: false });
    }
  },

  fetchTasks: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetchClient.get<TaskItem[]>("tasks");
      set({ tasks: res.data || [] });
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      set({ error: err.message || "Failed to fetch tasks" });
    } finally {
      set({ loading: false });
    }
  },

  fetchEvents: async () => {
    try {
      set({ loading: true, error: null });
      // Call upcoming events. Fallback to general events if upcoming is not mapped
      let res;
      try {
        res = await fetchClient.get<CalendarEvent[]>("events/upcoming");
      } catch {
        res = await fetchClient.get<CalendarEvent[]>("events");
      }
      set({ events: res.data || [] });
    } catch (err: any) {
      console.error("Error fetching events:", err);
      // Suppress severe error to not block UI if calendar endpoints aren't fully completed yet
    } finally {
      set({ loading: false });
    }
  },

  fetchNotes: async () => {
    try {
      const res = await fetchClient.get<{ notes: string } | string>("users/profile/notes");
      // Handle either JSON object or plain string responses
      const notesVal = typeof res.data === "object" && res.data !== null && "notes" in res.data
        ? res.data.notes
        : typeof res.data === "string"
        ? res.data
        : "";
      set({ notes: notesVal });
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  },

  createTask: async (taskData) => {
    try {
      set({ loading: true, error: null });
      await fetchClient.post<TaskItem, typeof taskData>("tasks", taskData);
      // Re-fetch tasks after successfully creating
      await get().fetchTasks();
    } catch (err: any) {
      console.error("Error creating task:", err);
      set({ error: err.message || "Failed to create task" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  createCategory: async (name, preferredStartTime, preferredEndTime) => {
    try {
      set({ loading: true, error: null });
      const payload = {
        name,
        preferredStartTime: preferredStartTime || null,
        preferredEndTime: preferredEndTime || null,
      };
      await fetchClient.post<Category, typeof payload>("categories", payload);
      // Re-fetch categories
      await get().fetchCategories();
    } catch (err: any) {
      console.error("Error creating category:", err);
      set({ error: err.message || "Failed to create category" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateTaskStatus: async (id, status) => {
    // Optimistic update for fluid drag-and-drop
    const originalTasks = get().tasks;
    const updatedTasks = originalTasks.map((t) =>
      t.id === id ? { ...t, status, isDone: status === "DONE" } : t
    );
    set({ tasks: updatedTasks });

    try {
      await fetchClient.patch<TaskItem, { status: TaskStatus; isDone: boolean }>(`tasks/${id}`, {
        status,
        isDone: status === "DONE",
      });
      // Optionally re-fetch to sync positions or parent tasks
      await get().fetchTasks();
    } catch (err: any) {
      console.error("Error updating task status:", err);
      // Rollback on failure
      set({ tasks: originalTasks, error: err.message || "Failed to update task status" });
    }
  },

  toggleTaskDone: async (id, isDone) => {
    // Optimistic update
    const originalTasks = get().tasks;
    const updatedTasks = originalTasks.map((t) =>
      t.id === id ? { ...t, isDone, status: (isDone ? "DONE" : t.status === "DONE" ? "TODO" : t.status) as TaskStatus } : t
    );
    set({ tasks: updatedTasks });

    try {
      const status: TaskStatus = isDone ? "DONE" : "TODO";
      await fetchClient.patch<TaskItem, { isDone: boolean; status: TaskStatus }>(`tasks/${id}`, {
        isDone,
        status,
      });
      await get().fetchTasks();
    } catch (err: any) {
      console.error("Error toggling task done:", err);
      set({ tasks: originalTasks, error: err.message || "Failed to toggle task" });
    }
  },

  updateNotes: async (notes) => {
    set({ notes });
    try {
      await fetchClient.put<any, { notes: string }>("users/profile/notes", { notes });
    } catch (err) {
      console.error("Error updating notes:", err);
    }
  },
}));
