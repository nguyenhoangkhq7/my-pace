"use client";

import { useEffect, useRef } from "react";
import { useAvailableTimeStore } from "../store/available-time.store";
import { useBoardStore } from "@/features/board/store/board.store";

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useAppVisibility() {
  const fetchAvailableTimeToday = useAvailableTimeStore((s) => s.fetchAvailableTimeToday);
  const checkin = useAvailableTimeStore((s) => s.checkin);
  const dataToday = useAvailableTimeStore((s) => s.dataToday);
  const { dailyPlanToday, fetchDailyPlanToday } = useBoardStore();

  const lastCheckedDate = useRef<string>("");

  const refreshAll = () => {
    const today = getTodayStr();
    fetchAvailableTimeToday(today);
    fetchDailyPlanToday(today);
  };

  // 1. Auto Check-in when user opens app on a new day and no plan has been created yet
  useEffect(() => {
    const today = getTodayStr();

    // Check if we haven't checked for today yet
    if (lastCheckedDate.current !== today) {
      lastCheckedDate.current = today;

      // If we already loaded the daily plan and it is null (meaning no plan created yet)
      // and we haven't checked in yet today (checkedIn is false)
      if (dailyPlanToday === null && (!dataToday || !dataToday.checkedIn)) {
        // Auto checkin in background
        checkin(today);
      }
    }
  }, [dailyPlanToday, dataToday, checkin]);

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
  }, [fetchAvailableTimeToday, fetchDailyPlanToday]);
}
