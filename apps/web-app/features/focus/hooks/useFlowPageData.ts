import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import { useConfirmPlan } from "@/features/board/hooks/useConfirmPlan";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useBoardStore } from "@/features/board/store/board.store";
import type { DailyPlan } from "@/features/board/types";

export function useFlowPageData() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const currentDate = getTodayStr(user?.timezone);

  const { tasks } = useTasks();
  const { confirmPlan, isConfirming } = useConfirmPlan();

  const { data: dailyPlanToday } = useQuery({
    queryKey: ["dailyPlan", currentDate],
    queryFn: () =>
      fetchClient.get<DailyPlan>(`daily-plans/${currentDate}`).then((r) => r.data),
    enabled: !!user,
  });

  // Pre-fetch categories for child components
  useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchClient.get("categories").then((r) => r.data),
    enabled: !!user,
  });

  const { updateTask } = useTasks();

  const handleConfirmPlan = async () => {
    if (!dailyPlanToday) return;
    if (!dailyPlanToday.isConfirmed) {
      await confirmPlan(dailyPlanToday.planDate);
    }
    useBoardStore.setState({ isStarted: true });
  };

  const saveActualMinutes = async (taskId: string, actualMinutes: number) => {
    if (actualMinutes <= 0) return;
    await updateTask({ id: taskId, data: { actualMinutes } });
    // Patch dailyPlan cache immediately to prevent stale alreadyWorkedMinutes
    queryClient.setQueryData(
      ["dailyPlan", currentDate],
      (old: DailyPlan | undefined) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((pt) =>
            pt.task.id === taskId
              ? { ...pt, task: { ...pt.task, actualMinutes } }
              : pt
          ),
        };
      }
    );
  };

  return {
    tasks,
    dailyPlanToday,
    currentDate,
    handleConfirmPlan,
    isConfirming,
    saveActualMinutes,
  };
}
