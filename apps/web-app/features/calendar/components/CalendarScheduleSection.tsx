"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { HugeiconsIcon } from "@hugeicons/react";
import { Task01Icon } from "@hugeicons/core-free-icons";

type CalendarScheduleSectionProps = {
  calendarEvents: EventInput[];
  onDateSelectAction: (selectInfo: DateSelectArg) => Promise<void>;
  onEventDropAction: (info: EventDropArg) => void;
  onEventResizeAction: (info: EventResizeDoneArg) => void;
  onEventClickAction: (info: EventClickArg) => Promise<void>;
};

export function CalendarScheduleSection({
  calendarEvents,
  onDateSelectAction,
  onEventDropAction,
  onEventResizeAction,
  onEventClickAction,
}: CalendarScheduleSectionProps) {
  return (
    <section className="order-1 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-inner">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Task01Icon} size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Lịch biểu</h2>
        </div>
        <p className="text-xs text-muted-foreground">Drag & drop task vào khung giờ trống</p>
      </div>

      <div className="min-h-0 flex-1">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay,dayGridMonth",
          }}
          editable
          droppable
          selectable
          selectMirror
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          events={calendarEvents}
          select={onDateSelectAction}
          eventDrop={onEventDropAction}
          eventResize={onEventResizeAction}
          eventClick={onEventClickAction}
          height="100%"
        />
      </div>
    </section>
  );
}



