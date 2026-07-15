'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import { TaskTimeBlock } from '@/features/board/types';

export async function getTimeBlocksAction(planId: string) {
  return await serverFetch<TaskTimeBlock[]>(`time-blocks?planId=${planId}`);
}

export async function saveTimeBlocksAction(data: { dailyPlanId: string; blocks: Omit<TaskTimeBlock, 'id'>[] }) {
  return await serverFetch<TaskTimeBlock[]>('time-blocks/batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
