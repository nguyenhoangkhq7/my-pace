import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTimeContextsAction,
  createTimeContextAction,
  updateTimeContextAction,
  deleteTimeContextAction,
} from "../actions/time-context.action";
import type { TimeContextCreateRequest, TimeContextUpdateRequest } from "../types";

export function useTimeContexts() {
  const queryClient = useQueryClient();

  const { data: timeContexts = [], isLoading, error } = useQuery({
    queryKey: ["time-contexts"],
    queryFn: getTimeContextsAction,
  });

  const createMutation = useMutation({
    mutationFn: (data: TimeContextCreateRequest) => createTimeContextAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimeContextUpdateRequest }) =>
      updateTimeContextAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTimeContextAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    timeContexts,
    isLoading,
    error,
    createTimeContext: createMutation.mutateAsync,
    updateTimeContext: updateMutation.mutateAsync,
    deleteTimeContext: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
