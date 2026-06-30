import { fetchClient } from "@/lib/fetchClient";
import { Task, DailyPlan, Category } from "../types";

export const boardApi = {
  getTasks: () => fetchClient.get<Task[]>("tasks"),
  createTask: (data: Partial<Task>) => fetchClient.post<Task, Partial<Task>>("tasks", data),
  updateTask: (id: string, data: Partial<Task>) => fetchClient.put<Task, Partial<Task>>(`tasks/${id}`, data),
  deleteTask: (id: string) => fetchClient.del<unknown>(`tasks/${id}`),

  getDailyPlan: (date: string) => fetchClient.get<DailyPlan>(`daily-plans/${date}`),
  planMyDay: (data: any) => fetchClient.post<DailyPlan, any>("daily-plans/plan-my-day", data),
  cancelPlan: (date: string) => fetchClient.post<unknown, Record<string, never>>(`daily-plans/${date}/cancel`, {}),
  toggleTaskDone: (planTaskId: string) => fetchClient.put<unknown, Record<string, never>>(`daily-plans/tasks/${planTaskId}/toggle-done`, {}),

  getCategories: () => fetchClient.get<Category[]>("categories"),
  createCategory: (data: Partial<Category>) => fetchClient.post<Category, Partial<Category>>("categories", data),
};
