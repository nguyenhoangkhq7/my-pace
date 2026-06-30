import { get, post, put, patch, del } from "@/lib/fetchClient";
import type {
  CreateEventPayload,
  FixedEventOccurrence,
  UpdateOccurrencePayload,
} from "../types";

const BASE = "calendar";

export const calendarApi = {
  /** Fetch all expanded occurrences in the date range. */
  getEvents: (start: string, end: string) =>
    get<FixedEventOccurrence[]>(`${BASE}/events?start=${start}&end=${end}`),

  /** Create a new fixed event (or recurring series). */
  createEvent: (payload: CreateEventPayload) =>
    post<FixedEventOccurrence, CreateEventPayload>(`${BASE}/events`, payload),

  /** Update all occurrences (replaces the entire series). */
  updateAllOccurrences: (seriesId: string, payload: CreateEventPayload) =>
    put<FixedEventOccurrence, CreateEventPayload>(`${BASE}/events/${seriesId}`, payload),

  /** Update only one occurrence by patching its exception row. */
  updateSingleOccurrence: (seriesId: string, date: string, payload: UpdateOccurrencePayload) =>
    patch<FixedEventOccurrence, UpdateOccurrencePayload>(
      `${BASE}/events/${seriesId}/exceptions/${date}`,
      payload
    ),

  /** Delete the entire series. */
  deleteAllOccurrences: (seriesId: string) =>
    del<void>(`${BASE}/events/${seriesId}`),

  /** Soft-delete a single occurrence. */
  deleteSingleOccurrence: (seriesId: string, date: string) =>
    del<void>(`${BASE}/events/${seriesId}/exceptions/${date}`),
};
