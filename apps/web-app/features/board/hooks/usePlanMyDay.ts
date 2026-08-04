import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { DailyPlan } from "../types";
import { useAutoSchedule } from "./useAutoSchedule";

export function usePlanMyDay(date: string) {
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

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
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      try {
        triggerAutoSchedule();
      } catch (e) {
        console.error("Auto-schedule after planMyDay failed", e);
      }
    },
  });

  return {
    planMyDay: planMyDayMutation.mutateAsync,
    isPlanningMyDay: planMyDayMutation.isPending,
  };
}
