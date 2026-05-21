import { fetchClient } from "@/lib/fetchClient";
import type {
  Category,
  CalendarEvent,
  EnergyLevel,
  TaskItem,
  TaskStatus,
} from "@/features/todos/types";

export type TaskMutationInput = {
  title?: string;
  description?: string | null;
  categoryId?: number | null;
  isImportant?: boolean;
  energyRequired?: EnergyLevel;
  estimatedMinutes?: number | null;
  dueDate?: string | null;
  status?: TaskStatus;
  isDone?: boolean;
  parentId?: number | null;
};

export type CreateTaskInput = TaskMutationInput & {
  title: string;
};

export type UpdateTaskInput = TaskMutationInput;

export type CreateCategoryInput = {
  name: string;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
};

export const todoService = {
  async getCategories(): Promise<Category[]> {
    const res = await fetchClient.get<Category[]>("categories");
    return res.data || [];
  },

  async getTasks(): Promise<TaskItem[]> {
    const res = await fetchClient.get<TaskItem[]>("tasks");
    return res.data || [];
  },

  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const res = await fetchClient.get<CalendarEvent[]>("events/upcoming");
      return res.data || [];
    } catch {
      const res = await fetchClient.get<CalendarEvent[]>("events");
      return res.data || [];
    }
  },

  async getNotes(): Promise<string> {
    const res = await fetchClient.get<{ notes: string } | string>("users/profile/notes");

    if (typeof res.data === "string") {
      return res.data;
    }

    if (res.data && typeof res.data === "object" && "notes" in res.data) {
      return res.data.notes || "";
    }

    return "";
  },

  async createTask(taskData: CreateTaskInput): Promise<TaskItem> {
    const payload: CreateTaskInput = {
      isImportant: false,
      energyRequired: "MEDIUM",
      ...taskData,
    };

    const res = await fetchClient.post<TaskItem, CreateTaskInput>("tasks", payload);

    if (!res.data) {
      throw new Error("Failed to create task");
    }

    return res.data;
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const payload = {
      name: input.name,
      preferredStartTime: input.preferredStartTime || null,
      preferredEndTime: input.preferredEndTime || null,
    };
    const res = await fetchClient.post<Category, typeof payload>("categories", payload);

    if (!res.data) {
      throw new Error("Failed to create category");
    }

    return res.data;
  },

  async updateTask(id: number, data: UpdateTaskInput): Promise<TaskItem> {
    const res = await fetchClient.patch<TaskItem, UpdateTaskInput>(`tasks/${id}`, data);

    if (!res.data) {
      throw new Error("Failed to update task");
    }

    return res.data;
  },

  async updateNotes(notes: string): Promise<void> {
    await fetchClient.put<void, { notes: string }>("users/profile/notes", { notes });
  },
};

