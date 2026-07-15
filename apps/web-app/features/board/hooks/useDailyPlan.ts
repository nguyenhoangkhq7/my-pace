import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyPlanAction, planMyDayAction, cancelPlanAction } from "../actions/plan.action";
import type { DailyPlan } from "../types";

export function useDailyPlan(date: string, initialData?: DailyPlan | null) {
  const queryClient = useQueryClient();

  const { data: dailyPlan = null, isLoading, error } = useQuery({
    queryKey: ["dailyPlan", date],
    queryFn: () => getDailyPlanAction(date),
    initialData,
    enabled: !!date,
  });

  const savePlanMutation = useMutation({
    mutationFn: ({ availableMinutes, tasks }: { availableMinutes: number; tasks: Array<{ taskId: string; isMit: boolean; sortOrder: number }> }) =>
      planMyDayAction({
        planDate: date,
        availableMinutes,
        tasks,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["dailyPlan", date], data);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const cancelPlanMutation = useMutation({
    mutationFn: () => cancelPlanAction(date),
    onSuccess: () => {
      queryClient.setQueryData(["dailyPlan", date], null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
