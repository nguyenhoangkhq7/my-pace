import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableTimeAction, checkinAction } from "../actions/available-time.action";
import { useGamificationStore } from "@/features/gamification";
import { AvailableTimeData } from "../types";
import { useAuthStore } from "@/features/auth";
import { getNowInTimezone } from "@/lib/date";

export function useAvailableTimeQuery(date: string) {
  const query = useQuery({
    queryKey: ["availableTime", date],
    queryFn: () => getAvailableTimeAction(date),
    enabled: !!date,
  });

  const user = useAuthStore((s) => s.user);
  const timezone = user?.timezone || "Asia/Ho_Chi_Minh";

  const [prevQueryData, setPrevQueryData] = useState<AvailableTimeData | null | undefined>(null);
  const [localAvailableMinutes, setLocalAvailableMinutes] = useState<number | null>(null);

  if (query.data !== prevQueryData) {
    setPrevQueryData(query.data);
    setLocalAvailableMinutes(query.data ? query.data.availableMinutes : null);
  }

  const queryClient = useQueryClient();

  // Smart local available time countdown ticking every 60 seconds
  useEffect(() => {
    if (!query.data || localAvailableMinutes === null || localAvailableMinutes <= 0) return;

    // Do NOT run countdown if the daily plan is already confirmed (time budget is frozen at confirmation time)
    const dailyPlan = queryClient.getQueryData<{ isConfirmed?: boolean }>(["dailyPlan", date]);
    if (query.data.isPlanConfirmed || dailyPlan?.isConfirmed) return;

    // Only run countdown for "today" in the user's timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = formatter.format(new Date());
    if (date !== todayStr) return;

    const interval = setInterval(() => {
      // Get current local time in user's timezone
      const now = getNowInTimezone(timezone);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

      // Check if current time falls within any blocked intervals (non-overlapping fixed events)
      const blockedIntervals = query.data.blockedIntervals || [];
      const isBlocked = blockedIntervals.some((interval: { startTime: string; endTime: string }) => {
        return currentTimeStr >= interval.startTime && currentTimeStr < interval.endTime;
      });

      if (!isBlocked) {
        setLocalAvailableMinutes((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [query.data, date, timezone, localAvailableMinutes]);

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          availableMinutes: localAvailableMinutes !== null ? localAvailableMinutes : query.data.availableMinutes,
        }
      : undefined,
  };
}

export function useCheckinMutation() {
  const queryClient = useQueryClient();
  const setStreakToCelebrate = useGamificationStore((s) => s.setStreakToCelebrate);

  return useMutation({
    mutationFn: ({ date, checkinTime }: { date: string; checkinTime?: string }) =>
      checkinAction(date, checkinTime),
    onSuccess: (data, { date }) => {
      // Update cache
      queryClient.setQueryData(["availableTime", date], data);

      // Invalidate queries to trigger immediate UI update for auto-created tasks/plans
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlan", date] });
      
      // Trigger celebration if streak > 0
      if (data && data.streak > 0) {
        setStreakToCelebrate(data.streak);
      }
    },
  });
}
