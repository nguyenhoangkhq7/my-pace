import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";

/**
 * Unified hook for all checklist CRUD + reorder operations on a single task.
 * Replaces inline mutations duplicated across 5 components.
 */
export function useChecklistMutations(taskId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
  };

  const addMutation = useMutation({
    mutationFn: (title: string) =>
      fetchClient.post(`tasks/${taskId}/checklists`, { title }).then((r) => r.data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: { title?: string; isCompleted?: boolean };
    }) =>
      fetchClient
        .put(`tasks/${taskId}/checklists/${checklistId}`, data)
        .then((r) => r.data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (checklistId: string) =>
      fetchClient.del(`tasks/${taskId}/checklists/${checklistId}`).then((r) => r.data),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (checklistIds: string[]) =>
      fetchClient
        .put(`tasks/${taskId}/checklists/reorder`, { checklistIds })
        .then((r) => r.data),
    onSuccess: invalidate,
  });

  return {
    addChecklist: addMutation.mutateAsync,
    updateChecklist: updateMutation.mutateAsync,
    deleteChecklist: deleteMutation.mutate,
    deleteChecklistAsync: deleteMutation.mutateAsync,
    reorderChecklists: reorderMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
