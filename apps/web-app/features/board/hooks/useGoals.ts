import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { Goal } from "@/features/goal/types";

export function useGoals() {
  const { data: goals = [], refetch: fetchGoals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => fetchClient.get<Goal[]>("goals").then((r) => r.data),
  });

  return { goals, fetchGoals };
}
