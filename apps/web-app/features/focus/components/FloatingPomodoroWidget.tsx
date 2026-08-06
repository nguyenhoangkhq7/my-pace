"use client";

import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useDraggable } from "@/hooks/use-draggable";
import { cn } from "@/lib/utils";

export function FloatingPomodoroWidget() {
  const isZenFull = useFocusStore((s) => s.isZenFull);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const isPomodoroFloating = useFocusStore((s) => s.isPomodoroFloating);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const timeLeft = useFocusStore((s) => s.timeLeft);
  const startTimer = useFocusStore((s) => s.startTimer);
  const pauseTimer = useFocusStore((s) => s.pauseTimer);
  const setPomodoroFloating = useFocusStore((s) => s.setPomodoroFloating);
  const { tasks } = useTasks();
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const {
    position: pomodoroPos,
    nodeRef: pomodoroNodeRef,
    handlers: pomodoroDragHandlers,
    isDragging: isPomodoroDragging,
  } = useDraggable({ 
    x: typeof window !== "undefined" ? window.innerWidth - 300 : 800, 
    y: 24 
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isZenFull || !activeTaskId || !isPomodoroFloating) return null;

  return (
    <div 
      ref={pomodoroNodeRef}
      {...pomodoroDragHandlers}
      style={{
        position: "fixed",
        left: pomodoroPos.x,
        top: pomodoroPos.y,
        touchAction: "none"
      }}
      className={cn(
        "z-[100] bg-background/85 backdrop-blur-md border px-4 py-2.5 rounded-2xl flex items-center space-x-3 transition-[background-color,border-color,box-shadow,transform] duration-300",
        isPomodoroDragging 
          ? "cursor-grabbing border-primary/50 shadow-[0_16px_48px_rgba(0,0,0,0.8)] scale-[1.02] opacity-95" 
          : "cursor-grab border-border hover:border-primary/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      )}
    >
      <div className="flex flex-col">
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider",
          pomodoroState === "focusing" ? "text-primary" : "text-emerald-400"
        )}>
          {pomodoroState === "focusing" ? "Focus" : "Break"}
        </span>
        <span className="text-lg font-black text-foreground tracking-wider tabular-nums leading-none mt-0.5">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex flex-col min-w-0 max-w-[120px] mr-2">
        <span className="text-[10px] font-semibold text-muted-foreground truncate">
          {activeTask?.title || "Focus Session"}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={pomodoroState === "focusing" || pomodoroState === "breaking" ? pauseTimer : startTimer}
          className="p-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
        >
          {pomodoroState === "focusing" || pomodoroState === "breaking" ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button
          onClick={() => setPomodoroFloating(false)}
          className="p-1.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
          title="Dock widget"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M10 14l-7 7"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/></svg>
        </button>
      </div>
    </div>
  );
}
