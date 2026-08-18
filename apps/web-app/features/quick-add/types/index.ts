export interface QuickAddChecklist {
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface QuickAddTaskResult {
  type: "task";
  title: string;
  estimatedMinutes: number | null;
  isUrgent: boolean;
  isImportant: boolean;
  dueDate: string | null;
  categoryId: string | null;
  goalId: string | null;
  notes: string | null;
  checklists: QuickAddChecklist[] | null;
  source?: "FAST_PATH" | "AI";
}

export interface QuickAddEventResult {
  type: "event";
  title: string;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  categoryId: string | null;
  notes: string | null;
  isAllDay?: boolean;
  recurrenceType?: "NONE" | "DAILY" | "WEEKLY" | null;
  recurrenceDaysOfWeek?: number[] | null;
  recurrenceEndDate?: string | null;
  estimatedMinutes?: number | null;
  source?: "FAST_PATH" | "AI";
}

export type QuickAddResult = QuickAddTaskResult | QuickAddEventResult;

export type QuickAddStatus = "idle" | "loading" | "preview" | "creating" | "error";

