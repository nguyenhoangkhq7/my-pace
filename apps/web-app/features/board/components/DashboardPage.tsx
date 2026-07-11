"use client";

import { useEffect, useState } from "react";
import { useAuthStore, InitialSetupForm } from "@/features/auth";
import { BacklogMatrix } from "@/features/board/components/BacklogMatrix";
import { ExecutionBoard } from "@/features/board/components/ExecutionBoard";
import { useBoardStore } from "@/features/board/store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";
import { useAppVisibility } from "@/features/available-time";
import { OutstandingTasksModal } from "./OutstandingTasksModal";
import { StreakCelebrationModal } from "@/features/available-time/components/StreakCelebrationModal";

export function DashboardPage() {
  useAppVisibility();
  const user = useAuthStore((s) => s.user);
  const { fetchTasks, fetchDailyPlanToday, fetchDailyPlanTomorrow, fetchCategories } = useBoardStore();
  const { fetchAvailableTimeToday, fetchAvailableTimeTomorrow } = useAvailableTimeStore();
  
  const tasks = useBoardStore(s => s.tasks);
  const dailyPlanToday = useBoardStore(s => s.dailyPlanToday);
  const dailyPlanTomorrow = useBoardStore(s => s.dailyPlanTomorrow);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

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
      const loadAll = async () => {
        try {
          await Promise.all([
            fetchCategories(),
            fetchTasks(),
            fetchDailyPlanToday(currentDate),
            fetchDailyPlanTomorrow(tomorrowDate),
            fetchAvailableTimeToday(currentDate),
            fetchAvailableTimeTomorrow(tomorrowDate),
          ]);
          setHasLoaded(true);
        } catch (err) {
          console.error("Error loading dashboard data:", err);
        }
      };
      loadAll();
    }
  }, [user, currentDate, tomorrowDate, fetchTasks, fetchDailyPlanToday, fetchDailyPlanTomorrow, fetchAvailableTimeToday, fetchAvailableTimeTomorrow, fetchCategories]);

  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  if (showSetup) {
    return <InitialSetupForm />;
  }

  const outstandingTasks = tasks.filter(task => {
    if (task.status !== "Picked for Today") return false;
    const inTodayPlan = !!dailyPlanToday?.tasks?.some(pt => pt.task?.id === task.id);
    const inTomorrowPlan = !!dailyPlanTomorrow?.tasks?.some(pt => pt.task?.id === task.id);
    return !inTodayPlan && !inTomorrowPlan;
  });

  const showOutstandingModal = hasLoaded && outstandingTasks.length > 0 && !hasDismissed;

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

      <OutstandingTasksModal
        isOpen={showOutstandingModal}
        onClose={() => setHasDismissed(true)}
        tasks={outstandingTasks}
      />

      <StreakCelebrationModal />
    </div>
  );
}
