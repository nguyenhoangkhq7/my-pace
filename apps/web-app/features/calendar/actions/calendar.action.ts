'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import type {
  CreateEventPayload,
  FixedEventOccurrence,
  UpdateOccurrencePayload,
} from '@/features/calendar/types';

const BASE = 'calendar';

export async function getEventsAction(start: string, end: string) {
  return await serverFetch<FixedEventOccurrence[]>(`${BASE}/events?start=${start}&end=${end}`);
}

export async function createEventAction(payload: CreateEventPayload) {
  return await serverFetch<FixedEventOccurrence>(`${BASE}/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAllOccurrencesAction(seriesId: string, payload: CreateEventPayload) {
  return await serverFetch<FixedEventOccurrence>(`${BASE}/events/${seriesId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateSingleOccurrenceAction(seriesId: string, date: string, payload: UpdateOccurrencePayload) {
  return await serverFetch<FixedEventOccurrence>(`${BASE}/events/${seriesId}/exceptions/${date}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateFromDateOnwardsAction(seriesId: string, date: string, payload: CreateEventPayload) {
  return await serverFetch<FixedEventOccurrence>(`${BASE}/events/${seriesId}/from/${date}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAllOccurrencesAction(seriesId: string) {
  return await serverFetch<void>(`${BASE}/events/${seriesId}`, {
    method: 'DELETE',
  });
}

export async function deleteSingleOccurrenceAction(seriesId: string, date: string) {
  return await serverFetch<void>(`${BASE}/events/${seriesId}/exceptions/${date}`, {
    method: 'DELETE',
  });
}

export async function deleteFromDateOnwardsAction(seriesId: string, date: string) {
  return await serverFetch<void>(`${BASE}/events/${seriesId}/from/${date}`, {
    method: 'DELETE',
  });
}

