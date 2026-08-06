import type { Category } from "@/features/board/types";

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface TimeContextSlot {
  id?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface TimeContext {
  id: string;
  name: string;
  slots: TimeContextSlot[];
  categories?: Category[];
}

export interface TimeContextCreateRequest {
  name: string;
  slots: TimeContextSlot[];
  categoryIds?: string[];
}

export interface TimeContextUpdateRequest {
  name: string;
  slots: TimeContextSlot[];
  categoryIds?: string[];
}
