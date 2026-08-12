"use client";

import React from "react";
import type { EventContentArg } from "@fullcalendar/core";
import { useTranslation } from "@/hooks/use-translation";

interface CalendarEventItemProps {
  eventInfo: EventContentArg;
}

export function CalendarEventItem({ eventInfo }: CalendarEventItemProps) {
  const { t } = useTranslation();

  if (eventInfo.event.display === "background") {
    return null;
  }
  const { extendedProps, title } = eventInfo.event;
  const isTimeBlock = extendedProps.isTimeBlock;
  const isFree = extendedProps.isFree;
  const isBusy = extendedProps.isBusy;

  if (isTimeBlock) {
    const totalParts = extendedProps.totalParts || 1;
    const partIndex = extendedProps.partIndex || 1;
    const rawTitle = extendedProps.taskTitle || title || "";
    const cleanTitle = rawTitle.replace(/^🔒\s*/, "");
    
    const totalLoggedMinutes = extendedProps.totalLoggedMinutes || 0;
    const blockDuration = extendedProps.blockDuration || 1;
    const progressPercent = Math.min(100, Math.round((totalLoggedMinutes / blockDuration) * 100));

    return (
      <div className="relative flex items-start justify-between gap-1.5 h-full w-full overflow-hidden text-xs leading-tight p-1 select-none font-sans group">
        {/* Progress Background */}
        {totalLoggedMinutes > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 bg-white/20 z-0 transition-all duration-300" 
            style={{ width: `${progressPercent}%` }} 
          />
        )}
        {/* Warning Badge for Over-logging */}
        {progressPercent >= 100 && totalLoggedMinutes > blockDuration && (
          <div className="absolute right-0 bottom-0 w-full h-1 bg-amber-500 z-0 opacity-80" title="Over-logged" />
        )}

        {/* Task Title at top-left */}
        <span className="relative z-10 font-medium text-white truncate flex-1 text-left self-start">
          {cleanTitle}
        </span>

        {/* Badges at top-right */}
        <div className="relative z-10 flex items-center gap-1 flex-shrink-0 self-start">
          {totalParts > 1 && (
            <span className="text-[10px] font-semibold bg-black/30 text-white/90 rounded-full px-1.5 py-0.2">
              {partIndex}/{totalParts}
            </span>
          )}

          {isBusy ? (
            <span className="text-[9px] font-semibold bg-black/30 text-white/90 rounded-full px-1.5 py-0.2 tracking-wide hidden sm:inline-flex">
              {t.calendar.locked}
            </span>
          ) : (
            <span className="text-[9px] font-semibold bg-white/20 text-white rounded-full px-1.5 py-0.2 tracking-wide hidden sm:inline-flex items-center">
              {t.calendar.flexible}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fixed Event
  const occurrence = extendedProps.occurrence;
  const rawTitle = occurrence?.title || title || "";
  const cleanTitle = rawTitle.replace(/^🔒\s*/, "");

  return (
    <div className="flex items-start justify-between gap-1.5 h-full w-full overflow-hidden text-xs leading-tight p-1 select-none font-sans">
      {/* Event Title at top-left */}
      <span className="font-semibold truncate flex-1 text-left self-start">
        {cleanTitle}
      </span>

      {/* Badges at top-right */}
      <div className="flex items-center gap-1 flex-shrink-0 self-start">
        {isFree ? (
          <span className="text-[9px] font-medium border border-current rounded-full px-1.5 py-0.2 opacity-85 hidden sm:inline-block">
            {t.calendar.free}
          </span>
        ) : (
          <span className="text-[9px] font-medium bg-black/25 text-white/90 rounded-full px-1.5 py-0.2 opacity-85 hidden sm:inline-block">
            {t.calendar.eventBadge}
          </span>
        )}
      </div>
    </div>
  );
}
