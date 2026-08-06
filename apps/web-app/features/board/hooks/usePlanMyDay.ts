import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { DailyPlan } from "../types";
export function usePlanMyDay(date: string) {
  const queryClient = useQueryClient();

  const planMyDayMutation = useMutation({
    mutationFn: ({
      availableMinutes,
      tasks,
    }: {
      availableMinutes: number;
      tasks: Array<{ taskId: string; isMit: boolean; sortOrder: number }>;
    }) =>
      fetchClient
        .post<DailyPlan>("daily-plans/plan-my-day", {
          planDate: date,
          availableMinutes,
          tasks,
        })
        .then((r) => r.data),
    onSuccess: async (data) => {
      queryClient.setQueryData(["dailyPlan", date], data);
      try {
        await fetchClient.post("auto-schedule", {});
      } catch (e) {
        console.error("Auto-schedule after planMyDay failed", e);
      }
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    planMyDay: planMyDayMutation.mutateAsync,
    isPlanningMyDay: planMyDayMutation.isPending,
  };
}
