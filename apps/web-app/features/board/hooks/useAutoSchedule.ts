import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { useWeeklyAllocationStore } from "@/features/calendar/hooks/useWeeklyAllocationStore";

const DEBOUNCE_MS = 1500;

export function useAutoSchedule() {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutoSchedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetchClient.post<any>("auto-schedule", {});
        if (res && res.data && res.data.weeklyAllocation) {
          useWeeklyAllocationStore.getState().setSummary(res.data.weeklyAllocation);
        }
        queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
        queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
        queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      } catch (e) {
        console.error("Auto-schedule failed:", e);
      }
    }, DEBOUNCE_MS);
  }, [queryClient]);

  return { triggerAutoSchedule };
}
