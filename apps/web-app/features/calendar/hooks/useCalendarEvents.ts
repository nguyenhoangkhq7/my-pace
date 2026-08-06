import { useCallback } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";
import { fetchClient } from "@/lib/fetchClient";
import type {
  CreateEventPayload,
  UpdateOccurrencePayload,
  FixedEventOccurrence
} from "../types";

interface UseCalendarEventsOptions {
  onMutationSuccess?: () => void;
}

export function useCalendarEvents(dateRange: { start: string, end: string }, options?: UseCalendarEventsOptions) {
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', dateRange.start, dateRange.end],
    queryFn: () => fetchClient.get<Record<string, unknown>[]>(`calendar/events?start=${dateRange.start}&end=${dateRange.end}`).then(r => r.data),
    enabled: !!dateRange.start && !!dateRange.end,
  });
  const refresh = useCallback(async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ['availableTime'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (err) {
      console.error("Failed to auto-refresh available time or stats", err);
    }

    // Auto re-schedule after event changes
    triggerAutoSchedule();

    if (options?.onMutationSuccess) {
      options.onMutationSuccess();
    }
  }, [options, queryClient, triggerAutoSchedule]);

  const createEventMutation = useMutation({
    mutationFn: (payload: CreateEventPayload) => fetchClient.post<FixedEventOccurrence>('calendar/events', payload).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const updateAllOccurrencesMutation = useMutation({
    mutationFn: ({ seriesId, payload }: { seriesId: string, payload: CreateEventPayload }) => fetchClient.put(`calendar/events/${seriesId}/all`, payload).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const updateSingleOccurrenceMutation = useMutation({
    mutationFn: ({ seriesId, date, payload }: { seriesId: string, date: string, payload: UpdateOccurrencePayload }) => fetchClient.put(`calendar/events/${seriesId}/occurrences/${date}`, payload).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const updateFromDateOnwardsMutation = useMutation({
    mutationFn: ({ seriesId, date, payload }: { seriesId: string, date: string, payload: CreateEventPayload }) => fetchClient.put(`calendar/events/${seriesId}/from/${date}`, payload).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const deleteAllOccurrencesMutation = useMutation({
    mutationFn: (seriesId: string) => fetchClient.del(`calendar/events/${seriesId}/all`).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const deleteSingleOccurrenceMutation = useMutation({
    mutationFn: ({ seriesId, date }: { seriesId: string, date: string }) => fetchClient.del(`calendar/events/${seriesId}/occurrences/${date}`).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const deleteFromDateOnwardsMutation = useMutation({
    mutationFn: ({ seriesId, date }: { seriesId: string, date: string }) => fetchClient.del(`calendar/events/${seriesId}/from/${date}`).then(r => r.data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  return {
    events,
    isLoading,
    createEvent: async (payload: CreateEventPayload) => { return await createEventMutation.mutateAsync(payload); },
    updateAllOccurrences: async (seriesId: string, payload: CreateEventPayload) => { await updateAllOccurrencesMutation.mutateAsync({ seriesId, payload }); },
    updateSingleOccurrence: async (seriesId: string, date: string, payload: UpdateOccurrencePayload) => { await updateSingleOccurrenceMutation.mutateAsync({ seriesId, date, payload }); },
    updateFromDateOnwards: async (seriesId: string, date: string, payload: CreateEventPayload) => { await updateFromDateOnwardsMutation.mutateAsync({ seriesId, date, payload }); },
    deleteAllOccurrences: async (seriesId: string) => { await deleteAllOccurrencesMutation.mutateAsync(seriesId); },
    deleteSingleOccurrence: async (seriesId: string, date: string) => { await deleteSingleOccurrenceMutation.mutateAsync({ seriesId, date }); },
    deleteFromDateOnwards: async (seriesId: string, date: string) => { await deleteFromDateOnwardsMutation.mutateAsync({ seriesId, date }); },
  };
}

