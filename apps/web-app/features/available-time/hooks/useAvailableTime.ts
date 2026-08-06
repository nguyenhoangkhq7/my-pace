import {useEffect, useMemo, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchClient} from "@/lib/fetchClient";
import type {AvailableTimeData} from "../types";
import {useAuthStore} from "@/features/auth";
import {getNowInTimezone} from "@/lib/date";

export function useAvailableTimeQuery(date: string) {
  const query = useQuery({
    queryKey: ["availableTime", date],
    queryFn: () => fetchClient.get<AvailableTimeData>(`calendar/available-time?date=${date}`).then(r => r.data),
    enabled: !!date,
  });

  const user = useAuthStore((s) => s.user);
  const timezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [decrementedMinutes, setDecrementedMinutes] = useState(0);
  const [prevServerMinutes, setPrevServerMinutes] = useState<number | undefined>(undefined);

  const serverMinutes = query.data?.availableMinutes;
  if (serverMinutes !== prevServerMinutes) {
    setPrevServerMinutes(serverMinutes);
    setDecrementedMinutes(0);
  }

  const queryClient = useQueryClient();
  const queryData = query.data;

  // Smart local available time countdown ticking every 60 seconds
  useEffect(() => {
    if (!queryData || queryData.availableMinutes <= 0) return;

    // Do NOT run countdown if the daily plan is already confirmed
    const dailyPlan = queryClient.getQueryData<{ isConfirmed?: boolean }>(["dailyPlan", date]);
    if (queryData.isPlanConfirmed || dailyPlan?.isConfirmed) return;

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
      const now = getNowInTimezone(timezone);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

      // Check if the current time is within any blocked intervals
      const blockedIntervals = queryData.blockedIntervals || [];
      const isBlocked = blockedIntervals.some((inv: { startTime: string; endTime: string }) => {
        return currentTimeStr >= inv.startTime && currentTimeStr < inv.endTime;
      });

      if (!isBlocked) {
        setDecrementedMinutes((prev) => prev + 1);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [queryData, date, timezone, queryClient]);

  const data = useMemo(() => {
    if (!queryData) return undefined;
    const mins = Math.max(0, queryData.availableMinutes - decrementedMinutes);
    if (mins === queryData.availableMinutes) return queryData;
    return {
      ...queryData,
      availableMinutes: mins,
    };
  }, [queryData, decrementedMinutes]);

  return {
    ...query,
    data,
  };
}

