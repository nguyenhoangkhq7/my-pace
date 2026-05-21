export type CalendarViewTab = "unscheduled" | "all";

export type ScheduledEventMeta = {
  isTask?: boolean;
  dbId?: number;
  taskId?: number;
};

export const CALENDAR_VIEW_TABS: CalendarViewTab[] = ["unscheduled", "all"];

export function isScheduledTaskEvent(meta: ScheduledEventMeta): boolean {
  return Boolean(meta.isTask && meta.dbId);
}


