"use client";

import { useEffect } from "react";
import { MatrixView, BoardView, useTasks, useCategories, useEvents, useNotes, useViewStore } from "@/features/todos";
import { CalendarView } from "@/features/calendar";

export default function DashboardPage() {
  const activeView = useViewStore((s) => s.activeView);

  const { fetchTasks } = useTasks();
  const { fetchCategories } = useCategories();
  const { fetchEvents } = useEvents();
  const { fetchNotes } = useNotes();

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchEvents();
    fetchNotes();
  }, [fetchTasks, fetchCategories, fetchEvents, fetchNotes]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {activeView === "matrix" && <MatrixView />}
      {activeView === "board" && <BoardView />}
      {activeView === "calendar" && <CalendarView />}
      {activeView !== "matrix" && activeView !== "board" && activeView !== "calendar" && (
        <div className="flex flex-col items-center justify-center flex-1 h-full min-h-75 text-center p-8 bg-card rounded-2xl border border-border">
          <p className="text-lg font-semibold text-foreground uppercase tracking-wider">
            {activeView} View
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This module is currently under development. Stay tuned!
          </p>
        </div>
      )}
    </div>
  );
}
