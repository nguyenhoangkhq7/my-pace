"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAvailableTimeQuery } from "./useAvailableTime";
import { useAuthStore } from "@/features/auth";
import { getTodayStr as getTodayStrHelper } from "@/lib/date";
import { useCheckinMutation } from "@/features/available-time/hooks/useCheckinMutation";
import { fetchClient } from "@/lib/fetchClient";

export function useAppVisibility() {
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStrHelper(user?.timezone);

  const queryClient = useQueryClient();
  const { data: dataToday } = useAvailableTimeQuery(todayStr);
  const checkinMutation = useCheckinMutation();

  const lastCheckedDate = useRef<string>("");
  const checkinMutate = checkinMutation.mutate;
  const isAwayRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Auto Check-in when user opens app on a new day
  useEffect(() => {
    const today = getTodayStrHelper(user?.timezone);

    if (dataToday !== null && dataToday !== undefined && !dataToday.checkedIn) {
      if (lastCheckedDate.current !== today) {
        lastCheckedDate.current = today;
        checkinMutate({ date: today });
      }
    }
  }, [dataToday, user?.timezone, checkinMutate]);

  // 2. Realtime Recalculation & Auto-Schedule on window focus or visibility change
  useEffect(() => {
    if (!user || !user.wakeTime || !user.sleepTime) return;

    const triggerAutoScheduleAndRefresh = async () => {
      try {
        await fetchClient.post("auto-schedule", {});
      } catch (e) {
        console.error("Auto-schedule on focus failed:", e);
      } finally {
        queryClient.invalidateQueries({ queryKey: ["availableTime"] });
        queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
        queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
        queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
        queryClient.invalidateQueries({ queryKey: ["weeklyAllocation"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
    };

    const handleLeave = () => {
      isAwayRef.current = true;
    };

    const handleReturn = () => {
      if (document.visibilityState === "hidden") return;

      if (isAwayRef.current) {
        isAwayRef.current = false;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          triggerAutoScheduleAndRefresh();
        }, 500);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleLeave();
      } else {
        handleReturn();
      }
    };

    window.addEventListener("blur", handleLeave);
    window.addEventListener("focus", handleReturn);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      window.removeEventListener("blur", handleLeave);
      window.removeEventListener("focus", handleReturn);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient, user]);
}

