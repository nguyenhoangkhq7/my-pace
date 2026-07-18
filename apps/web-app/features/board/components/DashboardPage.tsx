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
import { useQuery } from "@tanstack/react-query";
import { getUnreviewedPlanAction } from "../actions/plan.action";

export interface DashboardPageProps {
  initialData: {
    tasks: Task[];
    categories: Category[];
    dailyPlanToday: DailyPlan | null;
    dailyPlanTomorrow: DailyPlan | null;
    currentDate: string;
    tomorrowDate: string;
    day2Date: string;
    day3Date: string;
  };
}

export function DashboardPage({ 
  initialData: { currentDate, tomorrowDate, day2Date, day3Date, tasks: initialTasks, dailyPlanToday: initialDailyPlanToday, dailyPlanTomorrow: initialDailyPlanTomorrow } 
}: DashboardPageProps) {
  useAppVisibility();
  const user = useAuthStore((s) => s.user);

  useTasks(initialTasks);
  useDailyPlan(currentDate, initialDailyPlanToday);
  useDailyPlan(tomorrowDate, initialDailyPlanTomorrow);

  const [hasDismissed, setHasDismissed] = useState(false);

  const { data: unreviewedPlan = null } = useQuery({
    queryKey: ['unreviewedPlan', currentDate],
    queryFn: () => getUnreviewedPlanAction(currentDate),
  });

  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  if (showSetup) {
    return <InitialSetupForm />;
  }

  const hasUncompleted = !!unreviewedPlan && unreviewedPlan.tasks?.some(pt => pt.task?.status !== "Done");
  const showOutstandingModal = !!hasUncompleted && !hasDismissed;

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] p-4 sm:p-6 overflow-hidden">
      <div className="flex-1 grid grid-cols-[7fr_3fr] gap-6 min-h-0 w-full">
        <div className="min-h-0 h-full">
          <BacklogMatrix 
            currentDate={currentDate} 
            tomorrowDate={tomorrowDate} 
            day2Date={day2Date}
            day3Date={day3Date}
          />
        </div>
        <div className="min-h-0 h-full">
          <ExecutionBoard 
            currentDate={currentDate} 
            tomorrowDate={tomorrowDate} 
            day2Date={day2Date}
            day3Date={day3Date}
          />
        </div>
      </div>

      {unreviewedPlan && (
        <OutstandingTasksModal
          isOpen={showOutstandingModal}
          onClose={() => setHasDismissed(true)}
          unreviewedPlan={unreviewedPlan}
        />
      )}

      <StreakCelebrationModal />
    </div>
  );
}
