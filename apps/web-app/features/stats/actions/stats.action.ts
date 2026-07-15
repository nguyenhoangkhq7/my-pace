'use server';

import { serverFetch } from '@/lib/server-fetchClient';

export interface StatsOverviewResponse {
  matrixTime: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  categoryTime: Record<string, number>;
  completionRate: number;
  streak: number;
}

export async function getStatsOverviewAction(startDate?: string, endDate?: string) {
  let url = 'stats/overview';
  const params: string[] = [];
  
  if (startDate) params.push(`startDate=${startDate}`);
  if (endDate) params.push(`endDate=${endDate}`);
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return await serverFetch<StatsOverviewResponse>(url);
}
