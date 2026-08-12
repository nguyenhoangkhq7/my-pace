import { fetchClient } from "@/lib/fetchClient";
import type { TimeLog } from "@/features/board/types";

export interface CreateTimeLogRequest {
  timeBlockId?: string;
  taskId: string;
  loggedMinutes: number;
  startedAt: string;
  endedAt: string;
}

export interface UpdateTimeLogRequest {
  loggedMinutes: number;
  endedAt: string;
}

export async function createTimeLog(data: CreateTimeLogRequest): Promise<TimeLog> {
  const response = await fetchClient.post<TimeLog>("time-logs", data);
  return response.data;
}

export async function updateTimeLog(id: string, data: UpdateTimeLogRequest): Promise<TimeLog> {
  const response = await fetchClient.put<TimeLog>(`time-logs/${id}`, data);
  return response.data;
}

export async function getTimeLogsByTask(taskId: string): Promise<TimeLog[]> {
  const response = await fetchClient.get<TimeLog[]>(`time-logs?taskId=${taskId}`);
  return response.data;
}

export async function getTimeLogsByBlock(blockId: string): Promise<TimeLog[]> {
  const response = await fetchClient.get<TimeLog[]>(`time-logs?blockId=${blockId}`);
  return response.data;
}

export async function deleteTimeLog(id: string): Promise<void> {
  await fetchClient.del(`time-logs/${id}`);
}

/** Returns total logged focus minutes for the given date (YYYY-MM-DD) from the server. */
export async function getTodayFocusMinutes(date: string): Promise<number> {
  const response = await fetchClient.get<{ totalMinutes: number }>(`time-logs/summary?date=${date}`);
  return response.data.totalMinutes ?? 0;
}

