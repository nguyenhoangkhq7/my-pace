"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { useEvents } from "../../hooks/useEvents";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function UpcomingEvents() {
  const { events } = useEvents();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">Coming Up</h3>
        <button
          type="button"
          className="p-1 rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
        </button>
      </div>

      {/* Event list */}
      <div className="flex flex-col">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No upcoming events</p>
        ) : (
          events.map((event, index) => (
            <div key={event.id}>
              {index > 0 && <div className="border-t border-border" />}
              <div className="flex items-center gap-3 py-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <span className="text-sm text-foreground flex-1">
                  {event.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(event.startAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
