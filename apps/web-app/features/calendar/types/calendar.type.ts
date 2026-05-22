import { BoardTask } from "@/features/todos";

export type CalendarViewTab = "unscheduled" | "all";

export type ScheduledEventMeta = {
  isTask?: boolean;
  dbId?: number;
  taskId?: number;
}

export type CalendarEventInput = {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  color?: string | null;
};

export type CalendarTask = BoardTask;

export type CalendarEvent = {
  id: number;
  title: string;
  description: string | null;
  startAt: string; // ISO datetime
  endAt: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  color: string;
};

export type ScheduledTask = {
  id: number;
  taskId: number;
  taskTitle: string;
  categoryName: string;
  categoryColor: string;
  startTime: string;
  endTime: string;
  task: CalendarTask;
};