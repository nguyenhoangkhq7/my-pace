"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarHeader } from "@/features/calendar/components/CalendarHeader";
import { CalendarSidebar } from "@/features/calendar/components/CalendarSidebar";
import { CalendarStyles } from "@/features/calendar/components/CalendarStyles";
import { EventModal } from "@/features/calendar/components/EventModal";
import { TaskTimeBlockModal } from "@/features/board/components/TaskTimeBlockModal";
import { useCalendarPage } from "../hooks/useCalendarPage";
import { useTranslation } from "@/hooks/use-translation";

export function CalendarPage() {
  const { t } = useTranslation();
  const {
    calendarRef,
    sidebarRef,
    slotMin,
    slotMax,
    fcEvents,
    initialView,
    isCalendarMounted,
    isSidebarOpen,
    setIsSidebarOpen,
    fixedEventColor,
    handleColorChange,
    unscheduledTasks,
    hasUnscheduled,
    isAutoScheduling,
    handleAutoScheduleFromSidebar,
    modalOpen,
    setModalOpen,
    modalMode,
    modalDefaults,
    editOccurrence,
    createEvent,
    updateAllOccurrences,
    updateSingleOccurrence,
    deleteAllOccurrences,
    deleteSingleOccurrence,
    blockModalOpen,
    setBlockModalOpen,
    selectedBlock,
    selectedTask,
    isBlockMit,
    handleUnscheduleTask,
    isUnscheduling,
    handleConfirmPlan,
    isConfirming,

    // Event interactions
    handleDatesSet,
    handleSelect,
    handleEventClick,
    handleEventDrop,
    handleEventResize,
    handleEventReceive,
    handleEventDragStop,

    // Store data
    dailyPlanToday,
    timeBlocks,
    plannable,
  } = useCalendarPage();

  const isConfirmed = !plannable || !!dailyPlanToday?.isConfirmed;

  return (
    <div className="flex flex-col gap-4 h-full">
      <CalendarHeader 
        fixedEventColor={fixedEventColor}
        onColorChange={handleColorChange}
        hasUnscheduled={hasUnscheduled}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex gap-4 flex-1 min-h-0">
        
        {/* ── FullCalendar ── */}
        <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden shadow-sm calendar-wrapper">
          {isCalendarMounted && (
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={initialView}
              headerToolbar={{
                left:   "prev,next today",
                center: "title",
                right:  "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{ today: t.calendar.fcToday, month: t.calendar.fcMonth, week: t.calendar.fcWeek, day: t.calendar.fcDay }}
              locale={t.calendar.fcLocale}
              firstDay={1}
              slotMinTime={slotMin}
              slotMaxTime={slotMax}
              snapDuration="00:15:00"
              allDaySlot={false}
              nowIndicator
              selectable={plannable}
              selectMirror={plannable}
              editable={plannable}
              droppable={plannable && !dailyPlanToday?.isConfirmed}
              eventResizableFromStart={false}
              events={fcEvents}
              datesSet={handleDatesSet}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventReceive={handleEventReceive}
              eventDragStop={handleEventDragStop}
              height="100%"
            />
          )}
        </div>

        {/* ── Todo Today Sidebar ── */}
        {(plannable && (hasUnscheduled || !dailyPlanToday?.isConfirmed) && isSidebarOpen) && (
          <CalendarSidebar
            ref={sidebarRef}
            unscheduledTasks={unscheduledTasks}
            isAutoScheduling={isAutoScheduling}
            onAutoSchedule={handleAutoScheduleFromSidebar}
            dailyPlanLength={dailyPlanToday?.tasks?.length || 0}
            timeBlocksLength={timeBlocks.length}
            isSidebarOpen={isSidebarOpen}
            dailyPlanToday={dailyPlanToday}
            onConfirmPlan={handleConfirmPlan}
            isConfirming={isConfirming}
          />
        )}
      </div>

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

      <TaskTimeBlockModal
        open={blockModalOpen}
        block={selectedBlock}
        task={selectedTask}
        isMit={isBlockMit}
        isConfirmed={isConfirmed}
        onClose={() => setBlockModalOpen(false)}
        onUnschedule={handleUnscheduleTask}
        isSubmitting={isUnscheduling}
      />

      <CalendarStyles fixedEventColor={fixedEventColor} />
    </div>
  );
}
