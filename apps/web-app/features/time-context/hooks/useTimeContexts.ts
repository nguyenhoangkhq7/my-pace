import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { TimeContext, TimeContextCreateRequest, TimeContextUpdateRequest } from "../types";
import { useAutoSchedule } from "../../board/hooks/useAutoSchedule";

function onSuccessUpdateTimeContext(queryClient: QueryClient, triggerAutoSchedule: () => void) {
  queryClient.invalidateQueries({ queryKey: ["time-contexts"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
  queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
  queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
  triggerAutoSchedule();
}

export function useTimeContexts() {
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

  const { data: timeContexts = [], isLoading, error } = useQuery({
    queryKey: ["time-contexts"],
    queryFn: () => fetchClient.get<TimeContext[]>("time-contexts").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: TimeContextCreateRequest) => fetchClient.post<TimeContext>("time-contexts", data).then(r => r.data),
    onSuccess: () => onSuccessUpdateTimeContext(queryClient, triggerAutoSchedule),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimeContextUpdateRequest }) =>
      fetchClient.put<TimeContext>(`time-contexts/${id}`, data).then(r => r.data),
    onSuccess: () => onSuccessUpdateTimeContext(queryClient, triggerAutoSchedule),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchClient.del<void>(`time-contexts/${id}`).then(r => r.data),
    onSuccess: () => onSuccessUpdateTimeContext(queryClient, triggerAutoSchedule),
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
