'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import type { AvailableTimeData } from '../types';

export async function getAvailableTimeAction(date: string) {
  return await serverFetch<AvailableTimeData>(`calendar/available-time?date=${date}`);
}

export async function checkinAction(date: string, checkinTime?: string) {
  let url = `calendar/checkin?date=${date}`;
  if (checkinTime) {
    url += `&checkinTime=${checkinTime}`;
  }
  return await serverFetch<AvailableTimeData>(url, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
