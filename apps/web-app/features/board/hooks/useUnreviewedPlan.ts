import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { DailyPlan } from "../types";

export function useUnreviewedPlan(today: string, enabled = true) {
  const { data: unreviewedPlan = null } = useQuery({
    queryKey: ["unreviewedPlan", today],
    queryFn: () =>
      fetchClient
        .get<DailyPlan | null>(`daily-plans/unreviewed?today=${today}`)
        .then((r) => r.data),
    enabled,
  });

  return { unreviewedPlan };
}
