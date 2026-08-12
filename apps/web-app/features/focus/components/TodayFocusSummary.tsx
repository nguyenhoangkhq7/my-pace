"use client";

import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTodayFocusTotal } from "@/features/focus/hooks/useTodayFocusTotal";
import { cn } from "@/lib/utils";

/**
 * Shows total focus time for today:
 *   committedMinutes (from server TimeLogs) + live session seconds (from store).
 * Updates in real-time while a session is active.
 */
export function TodayFocusSummary() {
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const accumulatedFocusTime = useFocusStore((s) => s.accumulatedFocusTime);
  const focusSessionStartAccumulatedTime = useFocusStore((s) => s.focusSessionStartAccumulatedTime);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);

  const { committedMinutes } = useTodayFocusTotal();

  // Current live segment (seconds elapsed in the active focus segment, not yet committed to DB)
  const liveSegmentSeconds =
    pomodoroState === "focusing"
      ? Math.max(0, accumulatedFocusTime - focusSessionStartAccumulatedTime)
      : 0;

  const totalMinutes = committedMinutes + Math.floor(liveSegmentSeconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const isActive = pomodoroState === "focusing";

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mt-1",
      isVideoBackground ? "text-white/60" : "text-muted-foreground"
    )}>
      <span className={cn(
        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
        isActive ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
      )} />
      <span>Hôm nay</span>
      <span className={cn(
        "font-mono font-bold",
        isVideoBackground ? "text-white" : "text-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}
