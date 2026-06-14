import { fetchClient } from "@/lib/fetchClient";
import type {
  Category,
  BoardTask,
  CreateTaskInput,
  CreateCategoryInput,
  UpdateTaskInput,
} from "../types/todo.type";
import {CalendarEvent} from "@/features/calendar";


export const todoService = {
  async getCategories(): Promise<Category[]> {
    const res = await fetchClient.get<Category[]>("categories");
    return res.data || [];
  },

  async getTasks(): Promise<BoardTask[]> {
    const res = await fetchClient.get<BoardTask[]>("tasks");
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

  async createTask(taskData: CreateTaskInput): Promise<BoardTask> {
    const payload: CreateTaskInput = {
      isImportant: false,
      energyRequired: null,
      ...taskData,
    };

    const res = await fetchClient.post<BoardTask, CreateTaskInput>("tasks", payload);

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

  async updateTask(id: number, data: UpdateTaskInput): Promise<BoardTask> {
    const res = await fetchClient.patch<BoardTask, UpdateTaskInput>(`tasks/${id}`, data);

    if (!res.data) {
      throw new Error("Failed to update task");
    }

    return res.data;
  },

  async updateNotes(notes: string): Promise<void> {
    await fetchClient.put<void, { notes: string }>("users/profile/notes", { notes });
  },
};

