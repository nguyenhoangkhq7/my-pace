"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAvailableTimeQuery, useCheckinMutation } from "./useAvailableTime";
import { getDailyPlanAction } from "@/features/board/actions/plan.action";

import { useAuthStore } from "@/features/auth";
import { getTodayStr as getTodayStrHelper } from "@/lib/date";

function getTodayStr() {
  const { user } = useAuthStore.getState();
  return getTodayStrHelper(user?.timezone);
}

export function useAppVisibility() {
  const todayStr = getTodayStr();
  
  const { data: dataToday, refetch: refetchAvailableTime } = useAvailableTimeQuery(todayStr);
  const checkinMutation = useCheckinMutation();
  const { refetch: refetchDailyPlan } = useQuery({ 
    queryKey: ['dailyPlan', todayStr], 
    queryFn: () => getDailyPlanAction(todayStr) 
  });

  const lastCheckedDate = useRef<string>("");

  const refreshAll = useCallback(() => {
    refetchAvailableTime();
    refetchDailyPlan();
  }, [refetchAvailableTime, refetchDailyPlan]);

  // 1. Auto Check-in when user opens app on a new day
  useEffect(() => {
    const today = getTodayStr();

    // Wait until dataToday has been fetched from the server and is not null
    if (dataToday !== null && dataToday !== undefined && !dataToday.checkedIn) {
      if (lastCheckedDate.current !== today) {
        lastCheckedDate.current = today;
        // Auto checkin in background
        checkinMutation.mutate({ date: today });
      }
    }
  }, [dataToday, checkinMutation]);

  // 2. Realtime Recalculation on window focus or visibility change
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        refreshAll();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [refreshAll]);
}
