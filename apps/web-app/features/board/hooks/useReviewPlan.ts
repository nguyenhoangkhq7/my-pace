import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";

export function useReviewPlan() {
  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: ({ planDate, today, taskReviews }: {
      planDate: string;
      today: string;
      taskReviews: Array<{ taskId: string; action: string }>;
    }) =>
      fetchClient.post(`daily-plans/${planDate}/review`, { today, taskReviews }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["unreviewedPlan"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return {
    reviewPlan: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
  };
}
