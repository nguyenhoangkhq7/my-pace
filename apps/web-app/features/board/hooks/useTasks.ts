import {useQuery, useMutation, useQueryClient, QueryClient} from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { Task } from "../types";
import { useAutoSchedule } from "./useAutoSchedule";

function onSuccessUpdateTask(queryClient: QueryClient, triggerAutoSchedule: () => void) {
  queryClient.invalidateQueries({queryKey: ["tasks"]});
  triggerAutoSchedule();
}

export function useTasks(initialData?: Task[]) {
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetchClient.get<Task[]>('tasks').then(res => res.data),
    initialData,
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => fetchClient.post<Task, Partial<Task>>('tasks', data).then(res => res.data),
    onSuccess: () => {
      onSuccessUpdateTask(queryClient, triggerAutoSchedule);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => fetchClient.put<Task, Partial<Task>>(`tasks/${id}`, data).then(res => res.data),
    onSuccess: () => {
      onSuccessUpdateTask(queryClient, triggerAutoSchedule);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => fetchClient.del<void>(`tasks/${id}`).then(res => res.data),
    onSuccess: () => {
      onSuccessUpdateTask(queryClient, triggerAutoSchedule);
    },
  });

  return { 
    tasks, 
    isLoading, 
    error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
}
