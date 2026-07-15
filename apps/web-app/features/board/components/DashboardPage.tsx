"use client";

import { useState } from "react";
import { useAuthStore, InitialSetupForm } from "@/features/auth";
import { BacklogMatrix } from "@/features/board/components/BacklogMatrix";
import { ExecutionBoard } from "@/features/board/components/ExecutionBoard";
import { useAppVisibility } from "@/features/available-time";
import { OutstandingTasksModal } from "./OutstandingTasksModal";
import { StreakCelebrationModal } from "@/features/gamification";
import { useTasks } from "../hooks/useTasks";
import { useDailyPlan } from "../hooks/useDailyPlan";
import { Task, Category, DailyPlan } from "@/features/board/types";

export interface DashboardPageProps {
  initialData: {
    tasks: Task[];
    categories: Category[];
    dailyPlanToday: DailyPlan | null;
    dailyPlanTomorrow: DailyPlan | null;
    currentDate: string;
    tomorrowDate: string;
  };
}

export function DashboardPage({ 
  initialData: { currentDate, tomorrowDate, tasks: initialTasks, dailyPlanToday: initialDailyPlanToday, dailyPlanTomorrow: initialDailyPlanTomorrow } 
}: DashboardPageProps) {
  useAppVisibility();
  const user = useAuthStore((s) => s.user);

  const { tasks } = useTasks(initialTasks);
  const { dailyPlan: dailyPlanToday } = useDailyPlan(currentDate, initialDailyPlanToday);
  const { dailyPlan: dailyPlanTomorrow } = useDailyPlan(tomorrowDate, initialDailyPlanTomorrow);

  const [hasDismissed, setHasDismissed] = useState(false);

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

  const showOutstandingModal = outstandingTasks.length > 0 && !hasDismissed;

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] p-4 sm:p-6 overflow-hidden">
      <div className="flex-1 grid grid-cols-[7fr_3fr] gap-6 min-h-0 w-full">
        <div className="min-h-0 h-full">
          <BacklogMatrix currentDate={currentDate} tomorrowDate={tomorrowDate} />
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
