'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import { Goal, GoalCreateRequest, GoalUpdateRequest } from '../types';

export async function getGoalsAction() {
  return await serverFetch<Goal[]>('goals');
}

export async function createGoalAction(data: GoalCreateRequest) {
  return await serverFetch<Goal>('goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGoalAction(id: string, data: GoalUpdateRequest) {
  return await serverFetch<Goal>(`goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGoalAction(id: string) {
  return await serverFetch<void>(`goals/${id}`, {
    method: 'DELETE',
  });
}
