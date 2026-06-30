"use client";

import { useEffect, useState } from "react";
import { useAuthStore, InitialSetupForm } from "@/features/auth";
import { BacklogMatrix } from "@/features/board/components/BacklogMatrix";
import { ExecutionBoard } from "@/features/board/components/ExecutionBoard";
import { useBoardStore } from "@/features/board/store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";
import { useAppVisibility } from "@/features/available-time";


export default function DashboardPage() {
  useAppVisibility();
  const user = useAuthStore((s) => s.user);
  const { fetchTasks, fetchDailyPlanToday, fetchDailyPlanTomorrow, fetchCategories } = useBoardStore();
  const { fetchAvailableTimeToday, fetchAvailableTimeTomorrow } = useAvailableTimeStore();
  
  const [currentDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [tomorrowDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchTasks();
      fetchDailyPlanToday(currentDate);
      fetchDailyPlanTomorrow(tomorrowDate);
      fetchAvailableTimeToday(currentDate);
      fetchAvailableTimeTomorrow(tomorrowDate);
    }
  }, [user, currentDate, tomorrowDate, fetchTasks, fetchDailyPlanToday, fetchDailyPlanTomorrow, fetchAvailableTimeToday, fetchAvailableTimeTomorrow, fetchCategories]);

  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  if (showSetup) {
    return <InitialSetupForm />;
  }

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] p-4 sm:p-6 overflow-hidden">
      {/* 70/30 Split Pane */}
      <div className="flex-1 grid grid-cols-[7fr_3fr] gap-6 min-h-0 w-full">
        <div className="min-h-0 h-full">
          <BacklogMatrix />
        </div>
        <div className="min-h-0 h-full">
          <ExecutionBoard currentDate={currentDate} tomorrowDate={tomorrowDate} />
        </div>
      </div>
    </div>
  );
}
