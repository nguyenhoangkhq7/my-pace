"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAvailableTimeQuery, useCheckinMutation } from "./useAvailableTime";
import { useAuthStore } from "@/features/auth";
import { getTodayStr as getTodayStrHelper } from "@/lib/date";

export function useAppVisibility() {
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStrHelper(user?.timezone);

  const queryClient = useQueryClient();
  const { data: dataToday } = useAvailableTimeQuery(todayStr);
  const checkinMutation = useCheckinMutation();

  const lastCheckedDate = useRef<string>("");
  const checkinMutate = checkinMutation.mutate;

  // 1. Auto Check-in when user opens app on a new day
  useEffect(() => {
    const today = getTodayStrHelper(user?.timezone);

    if (dataToday !== null && dataToday !== undefined && !dataToday.checkedIn) {
      if (lastCheckedDate.current !== today) {
        lastCheckedDate.current = today;
        checkinMutate({ date: today });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataToday?.checkedIn, dataToday?.checkinTime, user?.timezone]);

  // 2. Realtime Recalculation on window focus or visibility change
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["availableTime", todayStr] });
        queryClient.invalidateQueries({ queryKey: ["dailyPlan", todayStr] });
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [queryClient, todayStr]);
}
