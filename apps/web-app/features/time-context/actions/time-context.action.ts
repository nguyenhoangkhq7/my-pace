'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import type { TimeContext, TimeContextCreateRequest, TimeContextUpdateRequest } from '../types';

export async function getTimeContextsAction(): Promise<TimeContext[]> {
  return await serverFetch<TimeContext[]>('time-contexts');
}

export async function getTimeContextAction(id: string): Promise<TimeContext> {
  return await serverFetch<TimeContext>(`time-contexts/${id}`);
}

export async function createTimeContextAction(data: TimeContextCreateRequest): Promise<TimeContext> {
  return await serverFetch<TimeContext>('time-contexts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTimeContextAction(id: string, data: TimeContextUpdateRequest): Promise<TimeContext> {
  return await serverFetch<TimeContext>(`time-contexts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTimeContextAction(id: string): Promise<void> {
  return await serverFetch<void>(`time-contexts/${id}`, {
    method: 'DELETE',
  });
}
