import React from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/board/types";
import { useFocusStore } from "@/features/focus/store/focus.store";

interface PomodoroTimerDisplayProps {
  activeTask: Task;
  pomodoroState: "idle" | "focusing" | "breaking" | "finished" | "paused";
  currentSession: number;
  totalSessions: number;
  timeLeft: number;
  focusMinutes: number;
  breakMinutes: number;
}

export function PomodoroTimerDisplay({
  activeTask,
  pomodoroState,
  currentSession,
  totalSessions,
  timeLeft,
  focusMinutes,
  breakMinutes,
}: PomodoroTimerDisplayProps) {
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const maxTime = pomodoroState === "breaking" ? breakMinutes * 60 : focusMinutes * 60;
  const progressPct = maxTime > 0 ? Math.min(100, Math.max(0, ((maxTime - timeLeft) / maxTime) * 100)) : 0;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  const renderStatusBadge = () => {
    if (pomodoroState === "idle") return { text: "READY TO FOCUS", color: "text-muted-foreground border-border bg-muted/50", dot: "bg-muted-foreground" };
    if (pomodoroState === "focusing") return { text: "DEEP WORK", color: "text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10", dot: "bg-cyan-500 dark:bg-cyan-400 animate-pulse" };
    if (pomodoroState === "breaking") return { text: "TAKE A BREAK", color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse" };
    if (pomodoroState === "finished") return { text: "SESSION COMPLETED", color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10", dot: "bg-indigo-500 dark:bg-indigo-400" };
    if (pomodoroState === "paused") return { text: "PAUSED", color: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10", dot: "bg-amber-500 dark:bg-amber-400" };
    return { text: "", color: "", dot: "" };
  };

  const status = renderStatusBadge();

  return (
    <div className="w-full flex flex-col items-center shrink-0 py-1">
      <div className={cn(
        "w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl flex flex-col items-center transition-all duration-500",
        isVideoBackground
          ? "bg-transparent border-none p-0 shadow-none"
          : ""
      )}>
        {/* Top Bar: Status Badge & Session Count */}
        <div className="flex items-center justify-between w-full px-1 mb-4 sm:mb-6 lg:mb-8">
          <div className={cn(
            "inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 lg:py-2 rounded-full border text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-[0.2em]",
            isVideoBackground ? "bg-black/45 backdrop-blur-md border-white/20 text-white shadow-xl" : "",
            status.color
          )}>
            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${status.dot}`} />
            <span>{status.text}</span>
          </div>

          {/* Sessions Indicator */}
          <div className={cn(
            "flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 lg:py-2 rounded-full border text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.15em] font-semibold text-muted-foreground",
            isVideoBackground ? "bg-black/45 backdrop-blur-md border-white/20 text-white shadow-xl" : "bg-card/80 backdrop-blur-md border-border"
          )}>
            <span>
              SESSION {currentSession}/{totalSessions}
            </span>
            <div className="flex items-center space-x-1 ml-1">
              {Array.from({ length: totalSessions }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full transition-all duration-300",
                    i < currentSession - 1
                      ? "bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                      : i === currentSession - 1 && pomodoroState !== "idle"
                      ? "bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] scale-125"
                      : isVideoBackground ? "bg-white/30" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Task Title */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8 px-4 max-w-lg lg:max-w-2xl xl:max-w-3xl">
          <h2 className={cn(
            "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight uppercase leading-tight",
            isVideoBackground ? "text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] [text-shadow:_0_2px_10px_rgba(0,0,0,0.8)]" : "text-foreground drop-shadow-xs"
          )}>
            {activeTask.title}
          </h2>
        </div>

        {/* Timer Cards Container */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-4 md:gap-5 lg:gap-7 xl:gap-8 my-2 sm:my-3 lg:my-5 select-none">
          {/* Hours card if > 0 */}
          {hours > 0 && (
            <>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "relative group min-w-[85px] sm:min-w-[105px] md:min-w-[130px] lg:min-w-[160px] xl:min-w-[190px] 2xl:min-w-[220px] h-[90px] sm:h-[115px] md:h-[140px] lg:h-[170px] xl:h-[200px] 2xl:h-[230px] border rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300",
                  isVideoBackground ? "bg-black/45 backdrop-blur-2xl border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "bg-card/90 backdrop-blur-xl border-border"
                )}>
                  <div className="absolute top-0 inset-x-0 h-1 lg:h-1.5 bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 opacity-90" />
                  <span className={cn(
                    "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black font-mono tracking-tighter drop-shadow-md",
                    isVideoBackground ? (pomodoroState === "paused" ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" : "text-white") : (pomodoroState === "paused" ? "text-amber-500 dark:text-amber-400" : "text-foreground")
                  )}>
                    {pad(hours)}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs lg:text-sm font-bold tracking-[0.25em] uppercase mt-2 lg:mt-3",
                  isVideoBackground ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-muted-foreground"
                )}>
                  HOURS
                </span>
              </div>

              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-500 dark:text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] pb-6 lg:pb-8 animate-pulse">:</span>
            </>
          )}

          {/* Minutes Card */}
          <div className="flex flex-col items-center">
            <div className={cn(
              "relative group min-w-[85px] sm:min-w-[105px] md:min-w-[130px] lg:min-w-[160px] xl:min-w-[190px] 2xl:min-w-[220px] h-[90px] sm:h-[115px] md:h-[140px] lg:h-[170px] xl:h-[200px] 2xl:h-[230px] border rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300",
              isVideoBackground ? "bg-black/45 backdrop-blur-2xl border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "bg-card/90 backdrop-blur-xl border-border"
            )}>
              <div className={cn(
                "absolute top-0 inset-x-0 h-1 lg:h-1.5 bg-gradient-to-r transition-all duration-500",
                pomodoroState === "breaking"
                  ? "from-emerald-400 to-teal-300"
                  : pomodoroState === "paused"
                  ? "from-amber-400 to-orange-400"
                  : "from-cyan-400 via-indigo-400 to-purple-400"
              )} />
              <span className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black font-mono tracking-tighter transition-colors duration-300 drop-shadow-md",
                isVideoBackground ? (pomodoroState === "paused" ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" : "text-white") : (pomodoroState === "paused" ? "text-amber-500 dark:text-amber-400" : "text-foreground")
              )}>
                {pad(minutes)}
              </span>
            </div>
            <span className={cn(
              "text-[10px] sm:text-xs lg:text-sm font-bold tracking-[0.25em] uppercase mt-2 lg:mt-3",
              isVideoBackground ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-muted-foreground"
            )}>
              MINUTES
            </span>
          </div>

          {/* Colon Separator */}
          <div className="flex flex-col items-center pb-6 lg:pb-8">
            <span className={cn(
              "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black transition-opacity duration-500",
              pomodoroState === "focusing" || pomodoroState === "breaking"
                ? "text-cyan-500 dark:text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse"
                : isVideoBackground
                ? "text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                : "text-muted-foreground/50"
            )}>
              :
            </span>
          </div>

          {/* Seconds Card */}
          <div className="flex flex-col items-center">
            <div className={cn(
              "relative group min-w-[85px] sm:min-w-[105px] md:min-w-[130px] lg:min-w-[160px] xl:min-w-[190px] 2xl:min-w-[220px] h-[90px] sm:h-[115px] md:h-[140px] lg:h-[170px] xl:h-[200px] 2xl:h-[230px] border rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300",
              isVideoBackground ? "bg-black/45 backdrop-blur-2xl border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "bg-card/90 backdrop-blur-xl border-border"
            )}>
              <div className={cn(
                "absolute top-0 inset-x-0 h-1 lg:h-1.5 bg-gradient-to-r transition-all duration-500",
                pomodoroState === "breaking"
                  ? "from-teal-300 to-emerald-400"
                  : pomodoroState === "paused"
                  ? "from-orange-400 to-amber-400"
                  : "from-indigo-400 via-purple-400 to-cyan-400"
              )} />
              <span className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black font-mono tracking-tighter transition-colors duration-300 drop-shadow-md",
                isVideoBackground ? (pomodoroState === "paused" ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" : "text-white") : (pomodoroState === "paused" ? "text-amber-500 dark:text-amber-400" : "text-foreground")
              )}>
                {pad(seconds)}
              </span>
            </div>
            <span className={cn(
              "text-[10px] sm:text-xs lg:text-sm font-bold tracking-[0.25em] uppercase mt-2 lg:mt-3",
              isVideoBackground ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-muted-foreground"
            )}>
              SECONDS
            </span>
          </div>
        </div>

        {/* Progress Bar under Cards */}
        <div className={cn(
          "w-full max-w-md lg:max-w-lg xl:max-w-xl h-1.5 lg:h-2 rounded-full overflow-hidden border mt-4 sm:mt-5 lg:mt-7 mb-1",
          isVideoBackground ? "bg-white/15 backdrop-blur-md border-white/20" : "bg-muted/60 border-border/50"
        )}>
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              pomodoroState === "breaking"
                ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                : pomodoroState === "paused"
                ? "bg-amber-400"
                : "bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
