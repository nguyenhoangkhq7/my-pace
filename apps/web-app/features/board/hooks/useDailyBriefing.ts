"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { DailyBriefingResponse } from "../types";

export function useDailyBriefing(date: string, enabled: boolean = true) {
  const { data: briefing, isLoading, refetch } = useQuery<DailyBriefingResponse | null>({
    queryKey: ["dailyBriefing", date],
    queryFn: async () => {
      try {
        const res = await fetchClient.get<DailyBriefingResponse>(`daily-plans/${date}/briefing`);
        return res.data;
      } catch (err) {
        console.error("Failed to fetch daily briefing:", err);
        return null;
      }
    },
    enabled: !!date && enabled,
    staleTime: 5 * 60 * 1000,
  });

  return { briefing, isLoading, refetch };
}
