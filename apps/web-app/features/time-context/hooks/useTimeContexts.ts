import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { TimeContext, TimeContextCreateRequest, TimeContextUpdateRequest } from "../types";

export function useTimeContexts() {
  const queryClient = useQueryClient();

  const { data: timeContexts = [], isLoading, error } = useQuery({
    queryKey: ["time-contexts"],
    queryFn: () => fetchClient.get<TimeContext[]>("time-contexts").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: TimeContextCreateRequest) => fetchClient.post<TimeContext>("time-contexts", data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimeContextUpdateRequest }) =>
      fetchClient.put<TimeContext>(`time-contexts/${id}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchClient.del<void>(`time-contexts/${id}`).then(r => r.data),
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
