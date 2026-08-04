import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";

export function useUpdateTaskStatus(taskId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newStatus: string) =>
      fetchClient.patch(`tasks/${taskId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    updateStatus: mutation.mutate,
    isUpdatingStatus: mutation.isPending,
  };
}
