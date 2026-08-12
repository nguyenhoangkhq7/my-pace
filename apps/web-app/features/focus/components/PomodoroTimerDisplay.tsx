import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/board/types";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTranslation } from "@/hooks/use-translation";

interface PomodoroTimerDisplayProps {
  activeTask: Task;
}

export const PomodoroTimerDisplay = memo(function PomodoroTimerDisplay({
  activeTask,
}: PomodoroTimerDisplayProps) {
  const { t } = useTranslation();
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const timeLeft = useFocusStore((s) => s.timeLeft);
  const currentSession = useFocusStore((s) => s.currentSession);
  const totalSessions = useFocusStore((s) => s.totalSessions);
  const focusMinutes = useFocusStore((s) => s.focusMinutes);
  const breakMinutes = useFocusStore((s) => s.breakMinutes);
  const maxTime = pomodoroState === "breaking" ? breakMinutes * 60 : focusMinutes * 60;
  const progressPct = maxTime > 0 ? Math.min(100, Math.max(0, ((maxTime - timeLeft) / maxTime) * 100)) : 0;


  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  const renderStatusBadge = () => {
    if (pomodoroState === "idle") return { text: t.flow.statusIdle, color: "text-muted-foreground border-border bg-muted/50", dot: "bg-muted-foreground" };
    if (pomodoroState === "focusing") return { text: t.flow.statusFocusing, color: "text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10", dot: "bg-cyan-500 dark:bg-cyan-400 animate-pulse" };
    if (pomodoroState === "breaking") return { text: t.flow.statusBreaking, color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-500 dark:bg-emerald-400 animate-pulse" };
    if (pomodoroState === "finished") return { text: t.flow.statusFinished, color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10", dot: "bg-indigo-500 dark:bg-indigo-400" };
    if (pomodoroState === "paused") return { text: t.flow.statusPaused, color: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10", dot: "bg-amber-500 dark:bg-amber-400" };
    return { text: "", color: "", dot: "" };
  };

  const status = renderStatusBadge();

  const hasHours = hours > 0;

  const cardClasses = hasHours
    ? "min-w-[62px] sm:min-w-[82px] md:min-w-[105px] lg:min-w-[130px] xl:min-w-[150px] 2xl:min-w-[170px] h-[70px] sm:h-[92px] md:h-[115px] lg:h-[140px] xl:h-[160px] 2xl:h-[180px] rounded-xl sm:rounded-2xl lg:rounded-3xl"
    : "min-w-[78px] sm:min-w-[98px] md:min-w-[120px] lg:min-w-[145px] xl:min-w-[170px] 2xl:min-w-[195px] h-[84px] sm:h-[108px] md:h-[130px] lg:h-[155px] xl:h-[180px] 2xl:h-[205px] rounded-2xl sm:rounded-3xl";

  const numberClasses = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black font-mono tracking-tighter transition-colors duration-300 drop-shadow-md";

  const labelClasses = hasHours
    ? "text-[9px] sm:text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase mt-1.5 lg:mt-2.5"
    : "text-[10px] sm:text-xs lg:text-sm font-bold tracking-[0.25em] uppercase mt-2 lg:mt-3";

  const colonClasses = hasHours
    ? "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black pb-5 lg:pb-7"
    : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black pb-6 lg:pb-8";

  const gapClasses = hasHours
    ? "gap-1.5 sm:gap-2.5 md:gap-3.5 lg:gap-4 xl:gap-5"
    : "gap-2 sm:gap-3.5 md:gap-5 lg:gap-6 xl:gap-7";

  return (
    <div className="w-full flex flex-col items-center shrink-0 py-1">
      <div className={cn(
        "w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl flex flex-col items-center transition-all duration-500",
        isVideoBackground
          ? "bg-transparent border-none p-0 shadow-none"
          : ""
      )}>
        {/* Top Bar: Status Badge & Session Count */}
        <div className="flex items-center justify-between w-full px-1 mb-3 sm:mb-5 lg:mb-6">
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
              {t.flow.sessionCount(currentSession, totalSessions)}
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

        {/* Task Title & TimeBlock Context Badge */}
        <div className="text-center mb-2 sm:mb-4 lg:mb-6 px-4 max-w-lg lg:max-w-2xl xl:max-w-3xl flex flex-col items-center">
          <h2 className={cn(
            "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight uppercase leading-tight",
            isVideoBackground ? "text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] [text-shadow:_0_2px_10px_rgba(0,0,0,0.8)]" : "text-foreground drop-shadow-xs"
          )}>
            {activeTask.title}
          </h2>
        </div>

        {/* Timer Cards Container */}
        <div className={cn("relative flex items-center justify-center my-2 sm:my-3 lg:my-4 select-none w-full", gapClasses)}>
          {/* Hours card if > 0 */}
          {hasHours && (
            <>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "relative group border flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300",
                  cardClasses,
                  isVideoBackground ? "bg-black/45 backdrop-blur-2xl border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "bg-card/90 backdrop-blur-xl border-border"
                )}>
                  <div className="absolute top-0 inset-x-0 h-1 lg:h-1.5 bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 opacity-90" />
                  <span className={cn(
                    numberClasses,
                    isVideoBackground ? (pomodoroState === "paused" ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" : "text-white") : (pomodoroState === "paused" ? "text-amber-500 dark:text-amber-400" : "text-foreground")
                  )}>
                    {pad(hours)}
                  </span>
                </div>
                <span className={cn(
                  labelClasses,
                  isVideoBackground ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-muted-foreground"
                )}>
                  {t.flow.timerHours}
                </span>
              </div>

              {/* Hours - Minutes Colon Separator */}
              <div className="flex flex-col items-center">
                <span className={cn(
                  colonClasses,
                  "text-cyan-500 dark:text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse"
                )}>
                  :
                </span>
              </div>
            </>
          )}

          {/* Minutes Card */}
          <div className="flex flex-col items-center">
            <div className={cn(
              "relative group border flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300",
              cardClasses,
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
                numberClasses,
                isVideoBackground ? (pomodoroState === "paused" ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" : "text-white") : (pomodoroState === "paused" ? "text-amber-500 dark:text-amber-400" : "text-foreground")
              )}>
                {pad(minutes)}
              </span>
            </div>
            <span className={cn(
              labelClasses,
              isVideoBackground ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-muted-foreground"
            )}>
              {t.flow.timerMinutes}
            </span>
          </div>

          {/* Minutes - Seconds Colon Separator */}
          <div className="flex flex-col items-center">
            <span className={cn(
              colonClasses,
              "transition-opacity duration-500",
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
              "relative group border flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300",
              cardClasses,
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
                numberClasses,
                isVideoBackground ? (pomodoroState === "paused" ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" : "text-white") : (pomodoroState === "paused" ? "text-amber-500 dark:text-amber-400" : "text-foreground")
              )}>
                {pad(seconds)}
              </span>
            </div>
            <span className={cn(
              labelClasses,
              isVideoBackground ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-muted-foreground"
            )}>
              {t.flow.timerSeconds}
            </span>
          </div>
        </div>

        {/* Progress Bar under Cards */}
        <div className={cn(
          "w-full max-w-md lg:max-w-lg xl:max-w-xl h-1.5 lg:h-2 rounded-full overflow-hidden border mt-3 sm:mt-4 lg:mt-5 mb-1",
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
});
