"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodayFocusMinutes } from "../services/timelog-service";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";

/**
 * Returns total logged focus minutes for today from the server,
 * combining all completed TimeLog entries across all tasks.
 * Re-fetches automatically when timeLogs or timeBlocks queries are invalidated.
 */
export function useTodayFocusTotal() {
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);

  const { data: committedMinutes = 0 } = useQuery({
    queryKey: ["timeLogs", "summary", todayStr],
    queryFn: () => getTodayFocusMinutes(todayStr),
    enabled: !!user,
    // Stale after 30s so it refreshes without user action
    staleTime: 30_000,
  });

  return { committedMinutes, todayStr };
}
