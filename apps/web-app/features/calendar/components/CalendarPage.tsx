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

export function CalendarPage() {
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
  } = useCalendarPage();

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-4 flex-1 min-h-0">
        
        {/* ── FullCalendar ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <CalendarHeader 
            fixedEventColor={fixedEventColor}
            onColorChange={handleColorChange}
            hasUnscheduled={hasUnscheduled}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

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
                droppable
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
        </div>

        {/* ── Todo Today Sidebar ── */}
        {hasUnscheduled && isSidebarOpen && (
          <CalendarSidebar
            ref={sidebarRef}
            unscheduledTasks={unscheduledTasks}
            isAutoScheduling={isAutoScheduling}
            onAutoSchedule={handleAutoScheduleFromSidebar}
            dailyPlanLength={dailyPlanToday?.tasks?.length || 0}
            timeBlocksLength={timeBlocks.length}
            isSidebarOpen={isSidebarOpen}
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
        onClose={() => setBlockModalOpen(false)}
        onUnschedule={handleUnscheduleTask}
        isSubmitting={isUnscheduling}
      />

      <CalendarStyles fixedEventColor={fixedEventColor} />
    </div>
  );
}
