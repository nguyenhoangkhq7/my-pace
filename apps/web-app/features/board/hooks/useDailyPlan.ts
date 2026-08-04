import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { DailyPlan } from "../types";
import { useAutoSchedule } from "./useAutoSchedule";

export function useDailyPlan(date: string, initialData?: DailyPlan | null) {
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

  const { data: dailyPlan = null, isLoading, error } = useQuery({
    queryKey: ["dailyPlan", date],
    queryFn: () => fetchClient.get<DailyPlan>(`daily-plans/${date}`).then(res => res.data),
    initialData,
    enabled: !!date,
  });

  const savePlanMutation = useMutation({
    mutationFn: ({ availableMinutes, tasks }: { availableMinutes: number; tasks: Array<{ taskId: string; isMit: boolean; sortOrder: number }> }) =>
      fetchClient.post<DailyPlan>('daily-plans/plan-my-day', {
        planDate: date,
        availableMinutes,
        tasks,
      }).then(res => res.data),
    onSuccess: async (data) => {
      queryClient.setQueryData(["dailyPlan", date], data);
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      try {
        triggerAutoSchedule();
      } catch (e) {
        console.error("Auto-schedule after savePlan failed", e);
      }
    },
  });

  const cancelPlanMutation = useMutation({
    mutationFn: () => fetchClient.post<unknown, undefined>(`daily-plans/${date}/cancel`, undefined).then(res => res.data),
    onSuccess: () => {
      queryClient.setQueryData(["dailyPlan", date], null);
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      try {
        triggerAutoSchedule();
      } catch (e) {
        console.error("Auto-schedule after cancelPlan failed", e);
      }
    },
  });

  return { 
    dailyPlan, 
    isLoading, 
    error,
    savePlan: savePlanMutation.mutateAsync,
    cancelPlan: cancelPlanMutation.mutateAsync,
    isSavingPlan: savePlanMutation.isPending,
    isCancellingPlan: cancelPlanMutation.isPending,
  };
}
