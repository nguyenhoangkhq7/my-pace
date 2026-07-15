'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import { Task } from '@/features/board/types';

export async function getTasksAction() {
  return await serverFetch<Task[]>('tasks');
}

export async function createTaskAction(data: Partial<Task>) {
  return await serverFetch<Task>('tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTaskAction(id: string, data: Partial<Task>) {
  return await serverFetch<Task>(`tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  return await serverFetch<Task>(`tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteTaskAction(id: string) {
  return await serverFetch<void>(`tasks/${id}`, {
    method: 'DELETE',
  });
}
