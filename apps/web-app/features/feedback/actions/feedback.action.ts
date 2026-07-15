'use server';

import { serverFetch } from '@/lib/server-fetchClient';

export interface FeedbackCreateRequest {
  category: string;
  content: string;
}

export async function createFeedbackAction(data: FeedbackCreateRequest) {
  return await serverFetch<unknown>('feedbacks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
