'use server';

import { serverFetch } from '@/lib/server-fetchClient';

export async function addChecklistItemAction(taskId: string, data: { title: string; isCompleted?: boolean }) {
  return await serverFetch<unknown>(`tasks/${taskId}/checklists`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChecklistItemAction(taskId: string, checklistId: string, data: { title?: string; isCompleted?: boolean }) {
  return await serverFetch<unknown>(`tasks/${taskId}/checklists/${checklistId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteChecklistItemAction(taskId: string, checklistId: string) {
  return await serverFetch<unknown>(`tasks/${taskId}/checklists/${checklistId}`, {
    method: 'DELETE',
  });
}

export async function reorderChecklistsAction(taskId: string, checklistIds: string[]) {
  return await serverFetch<unknown>(`tasks/${taskId}/checklists/reorder`, {
    method: 'PUT',
    body: JSON.stringify(checklistIds),
  });
}
