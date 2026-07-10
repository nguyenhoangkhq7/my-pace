"use client";

import React from "react";

interface CalendarStylesProps {
  fixedEventColor: string;
}

export function CalendarStyles({ fixedEventColor }: CalendarStylesProps) {
  return (
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
        background-color: ${fixedEventColor} !important;
        border-color: ${fixedEventColor} !important;
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
      .calendar-wrapper .fc-highlight { background: ${fixedEventColor}15 !important; }
      .calendar-wrapper .fc-day-today { background-color: rgba(255, 255, 255, 0.01) !important; }
      .calendar-wrapper .fc-col-header-cell-cushion,
      .calendar-wrapper .fc-timegrid-axis-cushion,
      .calendar-wrapper .fc-timegrid-slot-label-cushion {
        color: hsl(var(--muted-foreground));
        opacity: 0.8;
        font-size: 0.7rem;
        font-weight: 500;
      }
      /* Mờ hóa các đường viền chia ô và trục thời gian để lịch dịu mắt hơn */
      .calendar-wrapper .fc-scrollgrid { border-color: rgba(255, 255, 255, 0.06) !important; }
      .calendar-wrapper td, .calendar-wrapper th { border-color: rgba(255, 255, 255, 0.04) !important; }
      .calendar-wrapper .fc-timegrid-slots td { border-color: rgba(255, 255, 255, 0.03) !important; }
      
      /* Dragging ghost style */
      .fc-event-dragging { opacity: 0.85 !important; }
    `}</style>
  );
}
