"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/stores/filter.store";
import { useTodoStore } from "@/stores/todo.store";
import { MatrixView } from "@/components/matrix/MatrixView";
import { BoardSection } from "@/components/board/BoardSection";

export default function DashboardPage() {
  const activeView = useFilterStore((s) => s.activeView);

  const fetchTasks = useTodoStore((s) => s.fetchTasks);
  const fetchCategories = useTodoStore((s) => s.fetchCategories);
  const fetchEvents = useTodoStore((s) => s.fetchEvents);
  const fetchNotes = useTodoStore((s) => s.fetchNotes);

  useEffect(() => {
    // Fetch all database records once on mount
    fetchTasks();
    fetchCategories();
    fetchEvents();
    fetchNotes();
  }, [fetchTasks, fetchCategories, fetchEvents, fetchNotes]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {activeView === "matrix" && <MatrixView />}
      {activeView === "board" && <BoardSection />}
      {activeView !== "matrix" && activeView !== "board" && (
        <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[300px] text-center p-8 bg-pace-card rounded-2xl border border-slate-800">
          <p className="text-lg font-semibold text-slate-100 uppercase tracking-wider">
            {activeView} View
          </p>
          <p className="text-sm text-slate-400 mt-2">
            This module is currently under development. Stay tuned!
          </p>
        </div>
      )}
    </div>
  );
}
