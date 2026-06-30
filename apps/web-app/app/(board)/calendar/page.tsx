"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
// Custom hooks instead of Zustand stores
import { useCalendarEvents } from "@/features/calendar";
import { useAvailableTime, AvailableTimeWidget } from "@/features/available-time";
import { EventModal } from "@/features/calendar/components/EventModal";
import type { FixedEventOccurrence, ModalMode } from "@/features/calendar/types";
import type { UpdateOccurrencePayload } from "@/features/calendar/types";
import { useAuthStore } from "@/features/auth";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Sky-blue colour used for all fixed events */
const EVENT_COLOR     = "#0ea5e9"; // Tailwind sky-500
const EVENT_TEXT      = "#ffffff";
const EVENT_HIGHLIGHT = "rgba(14,165,233,0.15)";

/** Today as "YYYY-MM-DD" */
const todayStr = () => new Date().toISOString().split("T")[0];

/** Formats "HH:mm:ss" → "HH:mm" */
const toHHMM = (t: string) => t.substring(0, 5);

/** Parses a time string "HH:mm:ss" or "HH:mm" into a FullCalendar slotTime string */
const toSlotTime = (t: string | null | undefined, fallback: string) =>
  t ? t.substring(0, 5) + ":00" : fallback;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const calendarRef = useRef<FullCalendar>(null);

  const today = todayStr();
  const { data: availableTime, fetchAvailableTime, isLoading: isLoadingAvailableTime } = useAvailableTime();

  // Load events and bind available-time refresh callback
  const {
    events,
    fetchEvents,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    deleteAllOccurrences,
    deleteSingleOccurrence,
  } = useCalendarEvents({
    onMutationSuccess: () => {
      fetchAvailableTime(today);
    },
  });

  // Initial fetch of available time
  useEffect(() => {
    fetchAvailableTime(today);
  }, [today, fetchAvailableTime]);

  // Wake / sleep times drive the visible slot range.
  const slotMin = toSlotTime(user?.wakeTime,  "05:00:00");
  const slotMax = toSlotTime(user?.sleepTime, "23:00:00");

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalDefaults, setModalDefaults] = useState<{
    date?: string;
    start?: string;
    end?: string;
  }>({});
  const [editOccurrence, setEditOccurrence] = useState<FixedEventOccurrence | undefined>();

  // ── Convert store events → FullCalendar format ─────────────────────────────
  const fcEvents: EventInput[] = events.map((occ) => ({
    id: occ.id,
    title: occ.title,
    start: `${occ.occurrenceDate}T${occ.startTime}`,
    end:   `${occ.occurrenceDate}T${occ.endTime}`,
    extendedProps: { occurrence: occ },
    // Single unified sky-blue for all fixed events
    backgroundColor: EVENT_COLOR,
    borderColor:     EVENT_COLOR,
    textColor:       EVENT_TEXT,
    // Slightly lower opacity for recurring events to visually distinguish
    ...(occ.recurrenceType !== "NONE" && { backgroundColor: EVENT_COLOR + "d9" }),
  }));

  // ── FullCalendar Event Handlers ────────────────────────────────────────────

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const start = arg.startStr.split("T")[0];
      const end   = arg.endStr.split("T")[0];
      fetchEvents(start, end);
    },
    [fetchEvents]
  );

  const handleSelect = useCallback((arg: DateSelectArg) => {
    const start = arg.startStr;
    const end   = arg.endStr;
    const dateStr  = start.split("T")[0];
    const startStr = start.includes("T") ? toHHMM(start.split("T")[1]) : "09:00";
    const endStr   = end.includes("T")   ? toHHMM(end.split("T")[1])   : "10:00";

    setModalDefaults({ date: dateStr, start: startStr, end: endStr });
    setModalMode("create");
    setEditOccurrence(undefined);
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const occ = arg.event.extendedProps.occurrence as FixedEventOccurrence;
    setEditOccurrence(occ);
    setModalMode("edit");
    setModalDefaults({});
    setModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    async (arg: {
      event: { start: Date | null; end: Date | null; extendedProps: Record<string, unknown> };
      revert: () => void;
    }) => {
      const occ      = arg.event.extendedProps.occurrence as FixedEventOccurrence;
      const newStart = arg.event.start;
      const newEnd   = arg.event.end;

      if (!newStart || !newEnd) { arg.revert(); return; }

      const newDate      = newStart.toISOString().split("T")[0];
      const newStartTime = `${String(newStart.getHours()).padStart(2, "0")}:${String(newStart.getMinutes()).padStart(2, "0")}:00`;
      const newEndTime   = `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(2, "0")}:00`;

      const payload: UpdateOccurrencePayload = { overrideStartTime: newStartTime, overrideEndTime: newEndTime };

      try {
        await updateSingleOccurrence(occ.seriesId, newDate, payload);
      } catch {
        arg.revert();
      }
    },
    [updateSingleOccurrence]
  );

  const handleEventResize = useCallback(
    async (arg: {
      event: { end: Date | null; extendedProps: Record<string, unknown> };
      revert: () => void;
    }) => {
      const occ    = arg.event.extendedProps.occurrence as FixedEventOccurrence;
      const newEnd = arg.event.end;

      if (!newEnd) { arg.revert(); return; }

      const newEndTime = `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(2, "0")}:00`;
      const payload: UpdateOccurrencePayload = { overrideEndTime: newEndTime };

      try {
        await updateSingleOccurrence(occ.seriesId, occ.occurrenceDate, payload);
      } catch {
        arg.revert();
      }
    },
    [updateSingleOccurrence]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Available Time Widget (separate module) */}
      <AvailableTimeWidget data={availableTime} isLoading={isLoadingAvailableTime} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch cố định</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kéo để tạo sự kiện · Click để chỉnh sửa · Kéo thả để di chuyển
          </p>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden shadow-sm calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left:   "prev,next today",
            center: "title",
            right:  "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{ today: "Hôm nay", month: "Tháng", week: "Tuần", day: "Ngày" }}
          locale="vi"
          firstDay={1}
          slotMinTime={slotMin}
          slotMaxTime={slotMax}
          allDaySlot={false}
          nowIndicator
          selectable
          selectMirror
          editable
          eventResizableFromStart={false}
          events={fcEvents}
          datesSet={handleDatesSet}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="100%"
        />
      </div>

      {/* Event Modal */}
      <EventModal
        open={modalOpen}
        mode={modalMode}
        defaultDate={modalDefaults.date}
        defaultStart={modalDefaults.start}
        defaultEnd={modalDefaults.end}
        occurrence={editOccurrence}
        onClose={() => setModalOpen(false)}
        createEvent={createEvent}
        updateAllOccurrences={updateAllOccurrences}
        updateSingleOccurrence={updateSingleOccurrence}
        deleteAllOccurrences={deleteAllOccurrences}
        deleteSingleOccurrence={deleteSingleOccurrence}
      />

      {/* FullCalendar style overrides */}
      <style>{`
        .calendar-wrapper .fc { font-family: inherit; }
        .calendar-wrapper .fc-toolbar-title { font-size: 1rem; font-weight: 700; }
        .calendar-wrapper .fc-button {
          background-color: hsl(var(--secondary)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          box-shadow: none !important;
          border-radius: 0.5rem !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          padding: 0.3rem 0.7rem !important;
        }
        .calendar-wrapper .fc-button:hover { background-color: hsl(var(--accent)) !important; }
        .calendar-wrapper .fc-button-active,
        .calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active {
          background-color: ${EVENT_COLOR} !important;
          border-color: ${EVENT_COLOR} !important;
          color: #fff !important;
        }
        .calendar-wrapper .fc-timegrid-slot { height: 2.5rem; }
        .calendar-wrapper .fc-event {
          border-radius: 0.4rem !important;
          border: none !important;
          padding: 2px 5px !important;
          font-size: 0.75rem !important;
          cursor: pointer !important;
        }
        .calendar-wrapper .fc-highlight { background: ${EVENT_HIGHLIGHT} !important; }
        .calendar-wrapper .fc-day-today { background-color: ${EVENT_HIGHLIGHT} !important; }
        .calendar-wrapper .fc-col-header-cell-cushion,
        .calendar-wrapper .fc-timegrid-axis-cushion,
        .calendar-wrapper .fc-timegrid-slot-label-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.7rem;
          font-weight: 600;
        }
        .calendar-wrapper .fc-scrollgrid { border-color: hsl(var(--border)) !important; }
        .calendar-wrapper td, .calendar-wrapper th { border-color: hsl(var(--border)) !important; }
      `}</style>
    </div>
  );
}
