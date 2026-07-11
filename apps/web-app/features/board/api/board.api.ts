import { fetchClient } from "@/lib/fetchClient";
import { Task, DailyPlan, Category, TaskTimeBlock } from "../types";

export const boardApi = {
  getTasks: () => fetchClient.get<Task[]>("tasks"),
  createTask: (data: Partial<Task>) => fetchClient.post<Task, Partial<Task>>("tasks", data),
  updateTask: (id: string, data: Partial<Task>) => fetchClient.put<Task, Partial<Task>>(`tasks/${id}`, data),
  deleteTask: (id: string) => fetchClient.del<unknown>(`tasks/${id}`),

  addChecklistItem: (taskId: string, data: { title: string; isCompleted?: boolean }) => 
    fetchClient.post<unknown, typeof data>(`tasks/${taskId}/checklists`, data),
  updateChecklistItem: (taskId: string, checklistId: string, data: { title?: string; isCompleted?: boolean }) => 
    fetchClient.put<unknown, typeof data>(`tasks/${taskId}/checklists/${checklistId}`, data),
  deleteChecklistItem: (taskId: string, checklistId: string) => 
    fetchClient.del<unknown>(`tasks/${taskId}/checklists/${checklistId}`),
  reorderChecklists: (taskId: string, checklistIds: string[]) => 
    fetchClient.put<unknown, string[]>(`tasks/${taskId}/checklists/reorder`, checklistIds),

  getDailyPlan: (date: string) => fetchClient.get<DailyPlan>(`daily-plans/${date}`),
  planMyDay: (data: Record<string, unknown>) => fetchClient.post<DailyPlan, Record<string, unknown>>("daily-plans/plan-my-day", data),
  confirmPlan: (date: string) => fetchClient.post<DailyPlan, Record<string, never>>(`daily-plans/${date}/confirm`, {}),
  reviewPlan: (date: string) => fetchClient.post<DailyPlan, Record<string, never>>(`daily-plans/${date}/review`, {}),
  cancelPlan: (date: string) => fetchClient.post<unknown, Record<string, never>>(`daily-plans/${date}/cancel`, {}),
  toggleTaskDone: (planTaskId: string, addedCount?: number) => 
    fetchClient.put<unknown, Record<string, never>>(`daily-plans/tasks/${planTaskId}/toggle-done${addedCount !== undefined ? `?addedCount=${addedCount}` : ''}`, {}),

  getCategories: () => fetchClient.get<Category[]>("categories"),
  createCategory: (data: Partial<Category>) => fetchClient.post<Category, Partial<Category>>("categories", data),
  updateCategory: (id: string, data: Partial<Category>) => fetchClient.put<Category, Partial<Category>>(`categories/${id}`, data),
  deleteCategory: (id: string) => fetchClient.del<unknown>(`categories/${id}`),

  getTimeBlocks: (planId: string) => fetchClient.get<TaskTimeBlock[]>(`time-blocks?planId=${planId}`),
  saveTimeBlocks: (data: { dailyPlanId: string; blocks: Omit<TaskTimeBlock, 'id'>[] }) =>
    fetchClient.post<TaskTimeBlock[], typeof data>("time-blocks/batch", data),
};
