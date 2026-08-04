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
      .calendar-wrapper .fc-button-group {
        gap: 0.375rem !important;
        display: inline-flex !important;
      }
      .calendar-wrapper .fc-button-group .fc-button {
        border-radius: 0.5rem !important;
      }
      .calendar-wrapper .fc-toolbar-chunk {
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
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
      
      /* ── Dynamic & Compact All-Day Bar (Google Calendar Style) ── */
      .calendar-wrapper .fc-timegrid-allday {
        background-color: rgba(255, 255, 255, 0.015) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        padding: 0 !important;
      }
      .calendar-wrapper .fc-timegrid-allday-frame {
        min-height: 1.8rem !important;
        padding: 2px 2px !important;
      }
      .calendar-wrapper .fc-timegrid-allday .fc-daygrid-body {
        min-height: 0 !important;
      }
      .calendar-wrapper .fc-timegrid-allday .fc-daygrid-day-frame {
        min-height: 1.8rem !important;
        padding: 1px 2px !important;
      }
      .calendar-wrapper .fc-timegrid-allday .fc-timegrid-axis-cushion {
        padding: 2px 6px !important;
        font-size: 0.7rem !important;
        font-weight: 500 !important;
        text-transform: lowercase;
        opacity: 0.65;
        height: 100% !important;
        display: flex !important;
        align-items: center !important;
      }
      .calendar-wrapper .fc-daygrid-event {
        border-radius: 6px !important;
        padding: 4px 10px !important;
        margin: 1px 2px !important;
        font-size: 0.76rem !important;
        font-weight: 600 !important;
        letter-spacing: -0.01em !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.12) !important;
        transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease !important;
        border: none !important;
        min-height: 1.7rem !important;
        height: calc(100% - 2px) !important;
        display: flex !important;
        align-items: center !important;
      }
      .calendar-wrapper .fc-daygrid-event:hover {
        transform: translateY(-1px) scale(1.005) !important;
        box-shadow: 0 3px 6px rgba(0,0,0,0.18) !important;
        filter: brightness(1.08) !important;
      }
      .calendar-wrapper .fc-daygrid-event-dot {
        border-color: currentColor !important;
        margin-right: 5px !important;
      }
      .calendar-wrapper .fc-event-main {
        padding: 0 !important;
        height: 100% !important;
        width: 100% !important;
        display: flex !important;
        align-items: flex-start !important;
      }
      .calendar-wrapper .fc-event-main-frame {
        height: 100% !important;
        width: 100% !important;
        display: flex !important;
        align-items: flex-start !important;
      }

      /* Dragging ghost style */
      .fc-event-dragging { opacity: 0.85 !important; }

      /* ── Reclaim.ai Inspired Visual Distinction ── */
      
      /* 1. Fixed Events (Sự kiện cố định) */
      .fc-event-item {
        border-radius: 6px !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
        transition: transform 0.15s ease, filter 0.15s ease !important;
      }
      .fc-event-item:hover {
        filter: brightness(1.08) !important;
      }
      .fc-event-busy {
        border-left: 3.5px solid rgba(255, 255, 255, 0.85) !important;
      }
      .fc-event-free {
        border: 1.5px dotted currentColor !important;
        opacity: 0.75 !important;
      }
      .fc-event-free:hover {
        opacity: 0.95 !important;
      }
      
      /* 2. Task Time Blocks (Công việc xếp lịch) */
      .fc-task-block {
        border-radius: 8px !important;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18) !important;
        transition: transform 0.15s ease, box-shadow 0.15s ease !important;
      }
      .fc-task-block:hover {
        transform: translateY(-1px) scale(1.005) !important;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25) !important;
      }
      .fc-task-busy {
        border-left: 4px solid rgba(255, 255, 255, 0.9) !important;
      }
      /* Reclaim.ai Adaptive Hatch Pattern for Free Tasks */
      .fc-task-free {
        border: 1.5px dashed rgba(255, 255, 255, 0.5) !important;
        background-image: repeating-linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.15),
          rgba(255, 255, 255, 0.15) 8px,
          transparent 8px,
          transparent 16px
        ) !important;
      }
      .fc-block-not-in-plan {
        opacity: 0.45 !important;
      }
      .fc-block-not-in-plan:hover {
        opacity: 0.75 !important;
      }
    `}</style>
  );
}
