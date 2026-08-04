import type { Category } from "@/features/board/types";

// ─── Recurrence ──────────────────────────────────────────────────────────────

export type RecurrenceType = "NONE" | "DAILY" | "WEEKLY" | "CUSTOM";

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: "Không lặp",
  DAILY: "Hàng ngày",
  WEEKLY: "Hàng tuần",
  CUSTOM: "Tùy chỉnh",
};

export const DAYS_OF_WEEK = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 7, label: "CN" },
];

// ─── Event Types ─────────────────────────────────────────────────────────────

/** One expanded occurrence returned from the backend. */
export interface FixedEventOccurrence {
  /** Composite key: "{seriesId}_{occurrenceDate}" */
  id: string;
  /** UUID of the parent fixed_events row. */
  seriesId: string;
  title: string;
  notes?: string | null;
  occurrenceDate: string; // ISO date: "YYYY-MM-DD"
  startTime: string;      // "HH:mm:ss"
  endTime: string;        // "HH:mm:ss"
  isAllDay?: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: string | null;
  isException: boolean;
  categoryId?: string | null;
  category?: Category | null;
  availabilityStatus?: 'BUSY' | 'FREE';
}

/** Payload for creating a new event. */
export interface CreateEventPayload {
  title: string;
  notes?: string;
  startTime?: string;  // "HH:mm"
  endTime?: string;    // "HH:mm"
  isAllDay?: boolean;
  eventDate?: string; // "YYYY-MM-DD", required for NONE
  recurrenceType: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: string;
  categoryId?: string;
  availabilityStatus?: string;
}

/** Payload for updating a single occurrence exception. */
export interface UpdateOccurrencePayload {
  overrideTitle?: string;
  overrideNotes?: string;
  overrideStartTime?: string;
  overrideEndTime?: string;
  overrideIsAllDay?: boolean;
  isDeleted?: boolean;
  overrideCategoryId?: string | null;
  overrideAvailabilityStatus?: string;
}



// ─── Modal State ─────────────────────────────────────────────────────────────

export type ModalMode = "create" | "edit";

export interface ModalState {
  open: boolean;
  mode: ModalMode;
  /** Pre-selected date from drag-select. */
  defaultDate?: string;
  /** Pre-selected start time from drag-select. */
  defaultStart?: string;
  /** Pre-selected end time from drag-select. */
  defaultEnd?: string;
  /** The occurrence being edited (null for create). */
  occurrence?: FixedEventOccurrence;
}
