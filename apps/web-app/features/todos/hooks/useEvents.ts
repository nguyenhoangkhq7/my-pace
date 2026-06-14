"use client";

import { useCallback } from "react";
import { getApiErrorMessage } from "@/lib/fetchClient";
import {todoService} from "../services/todo.service";
import {useTodoStore} from "../stores/todo.store";
import {CalendarEvent} from "@/features/calendar";

export function useEvents() {
  const events = useTodoStore((s) => s.events);
  const loading = useTodoStore((s) => s.loading);
  const error = useTodoStore((s) => s.error);

  const fetchEvents = useCallback(async () => {
    useTodoStore.setState({ loading: true, error: null });

    try {
      const data = await todoService.getEvents();
      useTodoStore.setState({ events: data });
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to fetch events");
      console.error("Error fetching events:", error);
      useTodoStore.setState({ error: message });
      return [] as CalendarEvent[];
    } finally {
      useTodoStore.setState({ loading: false });
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
  };
}


