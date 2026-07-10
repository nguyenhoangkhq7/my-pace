import React from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/features/board/types";

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
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Timer Math
  const radius = 140;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const maxTime = pomodoroState === "breaking" ? breakMinutes * 60 : focusMinutes * 60;
  const strokeDashoffset = maxTime > 0 ? circumference - (timeLeft / maxTime) * circumference : 0;

  const renderStatusBadge = () => {
    if (pomodoroState === "idle") return { text: "READY TO FOCUS", color: "text-slate-400", dot: "bg-slate-400" };
    if (pomodoroState === "focusing") return { text: "DEEP WORK", color: "text-cyan-400", dot: "bg-cyan-400 animate-pulse" };
    if (pomodoroState === "breaking") return { text: "TAKE A BREAK", color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" };
    if (pomodoroState === "finished") return { text: "SESSIONS COMPLETED", color: "text-indigo-400", dot: "bg-indigo-400" };
    if (pomodoroState === "paused") return { text: "PAUSED", color: "text-amber-400", dot: "bg-amber-400" };
    return { text: "", color: "", dot: "" };
  };
  const status = renderStatusBadge();

  return (
    <>
      {/* Top: Status Badge, Title */}
      <div className="text-center mb-10 shrink-0 space-y-4 relative w-full flex flex-col items-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-card border border-border ${status.color} text-[10px] font-bold uppercase tracking-widest`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
          <span>{status.text}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-foreground px-4 line-clamp-2 leading-tight tracking-tight max-w-[400px]">
          {activeTask.title}
        </h2>
        <div className="flex items-center justify-center space-x-1.5 mt-2">
          {Array.from({ length: totalSessions }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                i < currentSession - 1 ? "bg-indigo-500" : i === currentSession - 1 && pomodoroState !== 'idle' ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Middle: Circular Timer */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-center transition-all shrink-0">
        <svg
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          className="absolute inset-0 transform -rotate-90 w-full h-full drop-shadow-[0_0_30px_rgba(99,102,241,0.15)]"
        >
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={pomodoroState === "breaking" ? "#10b981" : "#8b5cf6"} />
              <stop offset="100%" stopColor={pomodoroState === "breaking" ? "#34d399" : "#06b6d4"} />
            </linearGradient>
          </defs>
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={pomodoroState === "paused" ? "#f59e0b" : "url(#timerGradient)"}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        <div className="relative flex flex-col items-center justify-center z-10">
          <span className={cn(
            "text-6xl sm:text-7xl font-light tabular-nums tracking-tighter transition-colors duration-300", 
            pomodoroState === 'paused' ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {formatTime(timeLeft)}
          </span>
          
          {pomodoroState === "focusing" && (
            <div className="flex items-end justify-center space-x-1 h-4 mt-2 opacity-80">
              <div className="w-1 h-3 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
              <div className="w-1 h-full bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]"></div>
              <div className="w-1 h-3 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]"></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
