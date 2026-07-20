"use client";

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

/**
 * Returns true if the current local time is past the user's sleepTime,
 * meaning we should NOT show the "unreviewed plan" modal yet —
 * the user is still in their current day and the "new day" hasn't started.
 */
function isPastSleepTime(sleepTime?: string | null): boolean {
  if (!sleepTime) return false;
  const [sh, sm] = sleepTime.split(":").map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sleepMinutes = sh * 60 + sm;
  return currentMinutes >= sleepMinutes;
}

export function DashboardPage({ 
  initialData: { currentDate, tomorrowDate, day2Date, day3Date, tasks: initialTasks, dailyPlanToday: initialDailyPlanToday, dailyPlanTomorrow: initialDailyPlanTomorrow } 
}: DashboardPageProps) {
  useAppVisibility();
  const user = useAuthStore((s) => s.user);

  useTasks(initialTasks);
  useDailyPlan(currentDate, initialDailyPlanToday);
  useDailyPlan(tomorrowDate, initialDailyPlanTomorrow);

  // Don't query for an unreviewed plan if the user hasn't gone to sleep yet.
  // e.g. user sleeps at 22:00 and it's currently 23:00 → they're still in today,
  // so the "old unreviewed plan from yesterday" dialog should not appear.
  const isStillInCurrentDay = isPastSleepTime(user?.sleepTime);

  const { data: unreviewedPlan = null } = useQuery({
    queryKey: ['unreviewedPlan', currentDate],
    queryFn: () => getUnreviewedPlanAction(currentDate),
    // Disable the query entirely while the user is still in their current day.
    enabled: !isStillInCurrentDay,
  });

  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  if (showSetup) {
    return <InitialSetupForm />;
  }

  // The modal is shown only when there is a plan with uncompleted tasks.
  // Once the user clicks "Confirm & Start", reviewPlanAction marks it reviewed
  // and the query returns null → modal disappears permanently (no local state needed).
  const hasUncompleted = !!unreviewedPlan && unreviewedPlan.tasks?.some(pt => pt.task?.status !== "Done");

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

      {unreviewedPlan && hasUncompleted && (
        <OutstandingTasksModal
          isOpen={true}
          unreviewedPlan={unreviewedPlan}
          currentDate={currentDate}
        />
      )}

      <StreakCelebrationModal />
    </div>
  );
}
