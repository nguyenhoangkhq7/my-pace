import { create } from "zustand";
import type { FixedEventOccurrence } from "../types";

interface CalendarState {
  events: FixedEventOccurrence[];
  isLoadingEvents: boolean;
  currentRange: { start: string; end: string } | null;
  setEvents: (events: FixedEventOccurrence[]) => void;
  setIsLoadingEvents: (isLoading: boolean) => void;
  setCurrentRange: (range: { start: string; end: string } | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  isLoadingEvents: false,
  currentRange: null,
  setEvents: (events) => set({ events }),
  setIsLoadingEvents: (isLoadingEvents) => set({ isLoadingEvents }),
  setCurrentRange: (currentRange) => set({ currentRange }),
}));
