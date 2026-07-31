import { useCallback } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getEventsAction,
  createEventAction,
  updateAllOccurrencesAction,
  updateSingleOccurrenceAction,
  updateFromDateOnwardsAction,
  deleteAllOccurrencesAction,
  deleteSingleOccurrenceAction,
  deleteFromDateOnwardsAction
} from "../actions/calendar.action";
import type {
  CreateEventPayload,
  UpdateOccurrencePayload,
} from "../types";

interface UseCalendarEventsOptions {
  onMutationSuccess?: () => void;
}

export function useCalendarEvents(dateRange: { start: string, end: string }, options?: UseCalendarEventsOptions) {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', dateRange.start, dateRange.end],
    queryFn: () => getEventsAction(dateRange.start, dateRange.end),
    enabled: !!dateRange.start && !!dateRange.end,
  });
  const refresh = useCallback(async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ['availableTime'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (err) {
      console.error("Failed to auto-refresh available time or stats", err);
    }

    if (options?.onMutationSuccess) {
      options.onMutationSuccess();
    }
  }, [options, queryClient]);

  const createEventMutation = useMutation({
    mutationFn: createEventAction,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const updateAllOccurrencesMutation = useMutation({
    mutationFn: ({ seriesId, payload }: { seriesId: string, payload: CreateEventPayload }) => updateAllOccurrencesAction(seriesId, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const updateSingleOccurrenceMutation = useMutation({
    mutationFn: ({ seriesId, date, payload }: { seriesId: string, date: string, payload: UpdateOccurrencePayload }) => updateSingleOccurrenceAction(seriesId, date, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const updateFromDateOnwardsMutation = useMutation({
    mutationFn: ({ seriesId, date, payload }: { seriesId: string, date: string, payload: CreateEventPayload }) => updateFromDateOnwardsAction(seriesId, date, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const deleteAllOccurrencesMutation = useMutation({
    mutationFn: deleteAllOccurrencesAction,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const deleteSingleOccurrenceMutation = useMutation({
    mutationFn: ({ seriesId, date }: { seriesId: string, date: string }) => deleteSingleOccurrenceAction(seriesId, date),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  const deleteFromDateOnwardsMutation = useMutation({
    mutationFn: ({ seriesId, date }: { seriesId: string, date: string }) => deleteFromDateOnwardsAction(seriesId, date),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await refresh();
    }
  });

  return {
    events,
    isLoading,
    createEvent: createEventMutation.mutateAsync,
    updateAllOccurrences: async (seriesId: string, payload: CreateEventPayload) => { await updateAllOccurrencesMutation.mutateAsync({ seriesId, payload }); },
    updateSingleOccurrence: async (seriesId: string, date: string, payload: UpdateOccurrencePayload) => { await updateSingleOccurrenceMutation.mutateAsync({ seriesId, date, payload }); },
    updateFromDateOnwards: async (seriesId: string, date: string, payload: CreateEventPayload) => { await updateFromDateOnwardsMutation.mutateAsync({ seriesId, date, payload }); },
    deleteAllOccurrences: deleteAllOccurrencesMutation.mutateAsync,
    deleteSingleOccurrence: (seriesId: string, date: string) => deleteSingleOccurrenceMutation.mutateAsync({ seriesId, date }),
    deleteFromDateOnwards: (seriesId: string, date: string) => deleteFromDateOnwardsMutation.mutateAsync({ seriesId, date }),
  };
}

