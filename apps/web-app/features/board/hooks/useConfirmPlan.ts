import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { DailyPlan } from "@/features/board/types";

export function useConfirmPlan() {
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: (date: string) =>
      fetchClient.post<DailyPlan>(`daily-plans/${date}/confirm`, {}).then((r) => r.data),
    onSuccess: (data, date) => {
      queryClient.setQueryData(["dailyPlan", date], data);
    },
  });

  return {
    confirmPlan: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
  };
}
