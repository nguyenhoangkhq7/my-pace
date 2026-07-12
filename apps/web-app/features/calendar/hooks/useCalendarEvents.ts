import { useCallback } from "react";
import { useCalendarStore } from "../store/calendar.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";

import { calendarApi } from "../api/calendar.api";
import type {
  CreateEventPayload,
  UpdateOccurrencePayload,
} from "../types";

interface UseCalendarEventsOptions {
  onMutationSuccess?: () => void;
}

export function useCalendarEvents(options?: UseCalendarEventsOptions) {
  const events = useCalendarStore((s) => s.events);
  const isLoading = useCalendarStore((s) => s.isLoadingEvents);
  const currentRange = useCalendarStore((s) => s.currentRange);
  const setEvents = useCalendarStore((s) => s.setEvents);
  const setIsLoading = useCalendarStore((s) => s.setIsLoadingEvents);
  const setCurrentRange = useCalendarStore((s) => s.setCurrentRange);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const res = await calendarApi.getEvents(start, end);
      setEvents(res.data);
      setCurrentRange({ start, end });
    } catch (err) {
      console.error("Failed to fetch calendar events", err);
    } finally {
      setIsLoading(false);
    }
  }, [setEvents, setIsLoading, setCurrentRange]);

  const refresh = useCallback(async () => {
    if (currentRange) {
      await fetchEvents(currentRange.start, currentRange.end);
    }
    
    // Auto-refresh today & tomorrow's available time globally after calendar updates
    const getLocalDateStr = (d: Date) => 
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const today = getLocalDateStr(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getLocalDateStr(tomorrowDate);
    try {
      await useAvailableTimeStore.getState().fetchAvailableTimeToday(today);
      await useAvailableTimeStore.getState().fetchAvailableTimeTomorrow(tomorrow);
    } catch (err) {
      console.error("Failed to auto-refresh available time", err);
    }

    if (options?.onMutationSuccess) {
      options.onMutationSuccess();
    }
  }, [currentRange, fetchEvents, options]);

  const createEvent = useCallback(async (payload: CreateEventPayload) => {
    const res = await calendarApi.createEvent(payload);
    await refresh();
    return res.data;
  }, [refresh]);

  const updateAllOccurrences = useCallback(async (seriesId: string, payload: CreateEventPayload) => {
    await calendarApi.updateAllOccurrences(seriesId, payload);
    await refresh();
  }, [refresh]);

  const updateSingleOccurrence = useCallback(async (seriesId: string, date: string, payload: UpdateOccurrencePayload) => {
    await calendarApi.updateSingleOccurrence(seriesId, date, payload);
    await refresh();
  }, [refresh]);

  const deleteAllOccurrences = useCallback(async (seriesId: string) => {
    await calendarApi.deleteAllOccurrences(seriesId);
    await refresh();
  }, [refresh]);

  const deleteSingleOccurrence = useCallback(async (seriesId: string, date: string) => {
    await calendarApi.deleteSingleOccurrence(seriesId, date);
    await refresh();
  }, [refresh]);

  return {
    events,
    isLoading,
    fetchEvents,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    deleteAllOccurrences,
    deleteSingleOccurrence,
  };
}
