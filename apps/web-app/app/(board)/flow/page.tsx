"use client";

import { useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro } from "@/features/focus/components/FlowPomodoro";
import { FlowZenZone } from "@/features/focus/components/FlowZenZone";

export default function FlowPage() {
  const user = useAuthStore((s) => s.user);
  const { fetchTasks, fetchDailyPlanToday, fetchCategories, dailyPlanToday } = useBoardStore();

  // Fetch data if refreshed directly on /flow
  useEffect(() => {
    if (user && !dailyPlanToday) {
      const d = new Date();
      const currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      fetchCategories();
      fetchTasks();
      fetchDailyPlanToday(currentDate);
    }
  }, [user, dailyPlanToday, fetchTasks, fetchDailyPlanToday, fetchCategories]);

  // Auto-pause on unmount
  useEffect(() => {
    return () => {
      // Use useFocusStore.getState() to avoid dependency issues on unmount
      const state = useFocusStore.getState();
      if (state.pomodoroState === "focusing" || state.pomodoroState === "breaking") {
        state.pauseTimer();
      }
    };
  }, []);

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      <div className="w-[320px] h-full hidden lg:block shrink-0">
        <FlowTodoList />
      </div>
      <div className="flex-1 h-full min-w-0">
        <FlowPomodoro />
      </div>
      <div className="w-[320px] h-full hidden xl:block shrink-0">
        <FlowZenZone />
      </div>
    </div>
  );
}
