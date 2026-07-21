'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import { DailyPlan } from '@/features/board/types';

export async function getDailyPlanAction(date: string) {
  return await serverFetch<DailyPlan>(`daily-plans/${date}`);
}

export async function getUnreviewedPlanAction(today: string) {
  return await serverFetch<DailyPlan | null>(`daily-plans/unreviewed?today=${today}`);
}

export async function planMyDayAction(data: Record<string, unknown>) {
  return await serverFetch<DailyPlan>('daily-plans/plan-my-day', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmPlanAction(date: string) {
  return await serverFetch<DailyPlan>(`daily-plans/${date}/confirm`, {
    method: 'POST',
  });
}

export async function unconfirmPlanAction(date: string) {
  return await serverFetch<DailyPlan>(`daily-plans/${date}/unconfirm`, {
    method: 'POST',
  });
}

export interface TaskReviewItem {
  taskId: string;
  action: string;
}

export interface ReviewPlanPayload {
  today: string;
  taskReviews: TaskReviewItem[];
}

export async function reviewPlanAction(date: string, data?: ReviewPlanPayload) {
  return await serverFetch<DailyPlan>(`daily-plans/${date}/review`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function cancelPlanAction(date: string) {
  return await serverFetch<unknown>(`daily-plans/${date}/cancel`, {
    method: 'POST',
  });
}

export async function toggleTaskDoneAction(planTaskId: string) {
  return await serverFetch<unknown>(`daily-plans/tasks/${planTaskId}/toggle-done`, {
    method: 'PUT',
  });
}
