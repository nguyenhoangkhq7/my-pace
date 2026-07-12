"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { useAppVisibility } from "@/features/available-time";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro } from "@/features/focus/components/FlowPomodoro";
import { PomodoroSettingsModal } from "@/features/focus/components/PomodoroSettingsModal";
import { FlowZenZone } from "@/features/focus/components/FlowZenZone";
import { usePomodoro } from "@/features/focus/hooks/usePomodoro";
import { TaskCompletionDurationModal } from "@/features/focus/components/TaskCompletionDurationModal";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FlowSettingsDropdown } from "@/features/focus/components/FlowSettingsDropdown";
import { ConfirmPlanDialog } from "@/features/focus/components/ConfirmPlanDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useDraggable } from "@/hooks/use-draggable";
import { cn } from "@/lib/utils";
import type { DailyPlanTask } from "@/features/board/types";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";
import type { GroupImperativeHandle } from "react-resizable-panels";

// Threshold: when zenzone panel reaches this %, auto-enter Zen Full mode
const ZEN_FULL_THRESHOLD = 65;

export function FlowPage() {
  useAppVisibility();
  const { t } = useTranslation();
  usePomodoro();
  const user = useAuthStore((s) => s.user);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const timeLeft = useFocusStore((s) => s.timeLeft);
  const startTimer = useFocusStore((s) => s.startTimer);
  const pauseTimer = useFocusStore((s) => s.pauseTimer);
  const openFocusMode = useFocusStore((s) => s.openFocusMode);
  const isZenFull = useFocusStore((s) => s.isZenFull);
  const setZenFull = useFocusStore((s) => s.setZenFull);
  const isPomodoroFloating = useFocusStore((s) => s.isPomodoroFloating);
  const setPomodoroFloating = useFocusStore((s) => s.setPomodoroFloating);
  const confirmPlan = useBoardStore((s) => s.confirmPlan);
  const { tasks, fetchTasks, fetchDailyPlanToday, fetchCategories, dailyPlanToday } = useBoardStore();

  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const [mounted, setMounted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Floating Pomodoro widget draggable logic
  const {
    position: pomodoroPos,
    nodeRef: pomodoroNodeRef,
    handlers: pomodoroDragHandlers,
    isDragging: isPomodoroDragging,
  } = useDraggable({ 
    x: typeof window !== "undefined" ? window.innerWidth - 300 : 800, 
    y: 24 
  });
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isConfirmPlanOpen, setIsConfirmPlanOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<DailyPlanTask | null>(null);

  // ─── Imperative handle to expand/collapse panels without unmounting ───────────
  // This is the KEY to preventing iframe reload: we use setLayout() instead of
  // conditionally rendering different component trees.
  const groupRef = useRef<GroupImperativeHandle | null>(null);

  // Saves panel sizes before entering Zen Full mode, for restoration on exit
  const lastGoodSizesRef = useRef<[number, number, number]>([20, 60, 20]);

  // Ref-based save guard (avoids re-renders from canSave state changes)
  const canSaveRef = useRef(false);
  const canSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCanSave = () => {
    canSaveRef.current = false;
    if (canSaveTimerRef.current) clearTimeout(canSaveTimerRef.current);
    canSaveTimerRef.current = setTimeout(() => {
      canSaveRef.current = true;
    }, 1000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const d = new Date();
      const currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      fetchCategories();
      fetchTasks();
      fetchDailyPlanToday(currentDate);
    }
  }, [user, fetchTasks, fetchDailyPlanToday, fetchCategories]);

  useEffect(() => {
    return () => {
      const state = useFocusStore.getState();
      if (state.pomodoroState === "focusing" || state.pomodoroState === "breaking") {
        state.pauseTimer();
      }
    };
  }, []);

  useEffect(() => {
    scheduleCanSave();
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") scheduleCanSave();
    };
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      if (canSaveTimerRef.current) clearTimeout(canSaveTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If breakpoint drops below XL, exit Zen Full mode automatically
  useEffect(() => {
    if (!isXl && useFocusStore.getState().isZenFull) {
      useFocusStore.getState().setZenFull(false);
    }
  }, [isXl]);

  const layoutKey = isXl ? "layout-xl" : isLg ? "layout-lg" : "layout-base";
  const uniqueKey = `${layoutKey}-${resetKey}`;
  const [sizes, setSizes] = useState<number[] | null>(null);

  useEffect(() => {
    const expectedLen = isXl ? 3 : isLg ? 2 : 1;
    Promise.resolve().then(() => {
      const saved = localStorage.getItem(`myPaceFlowSizes_${layoutKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === expectedLen) {
            if (expectedLen === 3 && (parsed[0] < 15 || parsed[2] < 15)) {
              setSizes([20, 60, 20]);
              localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify([20, 60, 20]));
              return;
            }
            if (expectedLen === 2 && parsed[0] < 15) {
              setSizes([25, 75]);
              localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify([25, 75]));
              return;
            }
            setSizes(parsed);
            return;
          }
          localStorage.removeItem(`myPaceFlowSizes_${layoutKey}`);
        } catch {}
      }
      if (isXl) setSizes([20, 60, 20]);
      else if (isLg) setSizes([25, 75]);
      else setSizes([100]);
    });
  }, [layoutKey, resetKey, isXl, isLg]);

  const requestFullscreen = () => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ─── Layout change handler (fires after pointer release) ─────────────────────
  // Dual purpose:
  //  1. Detect when zenzone reaches threshold → imperatively expand to full via setLayout()
  //  2. Detect when zenzone is squeezed below exit threshold in Zen Full → exit
  //  3. Save sizes to localStorage for normal layout changes
  const handleLayoutChanged = (layout: Record<string, number>) => {
    const store = useFocusStore.getState();
    const zenzonePercent = layout["zenzone-panel"] ?? 0;

    if (store.isZenFull) {
      // ── In Zen Full mode: check if user is squeezing to exit ──────────────
      if (isXl && zenzonePercent < 99.5) {
        const restoredSizes: [number, number, number] = [
          layout["todo-panel"] ?? lastGoodSizesRef.current[0],
          layout["pomodoro-panel"] ?? lastGoodSizesRef.current[1],
          zenzonePercent,
        ];
        store.setZenFull(false);
        exitFullscreen();
        setSizes(restoredSizes);
        try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify(restoredSizes)); } catch {}
      }
      // Otherwise still in Zen Full → ignore this layout event
      return;
    }

    // ── Normal mode: check if zenzone reaches threshold to enter Zen Full ──
    if (isXl && zenzonePercent >= ZEN_FULL_THRESHOLD) {
      lastGoodSizesRef.current = [
        layout["todo-panel"] ?? 20,
        layout["pomodoro-panel"] ?? 60,
        zenzonePercent,
      ];
      store.setZenFull(true);
      requestFullscreen();
      // Imperatively collapse others and expand zenzone to 100%
      // Both todo and pomodoro must be collapsible for this to work
      groupRef.current?.setLayout({
        "todo-panel": 0,
        "pomodoro-panel": 0,
        "zenzone-panel": 100,
      });
      return;
    }

    // ── Normal mode: save layout to localStorage ───────────────────────────
    if (!canSaveRef.current || document.visibilityState !== "visible") return;

    if (isXl && layout["todo-panel"] !== undefined && layout["zenzone-panel"] !== undefined) {
      const arr = [layout["todo-panel"], layout["pomodoro-panel"] ?? 60, layout["zenzone-panel"]];
      if ((arr[0] > 0 && arr[0] < 14) || (arr[2] > 0 && arr[2] < 14)) return;
      try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify(arr)); } catch {}
    } else if (isLg && !isXl && layout["todo-panel"] !== undefined) {
      const arr = [layout["todo-panel"], layout["pomodoro-panel"] ?? 75];
      if (arr[0] > 0 && arr[0] < 14) return;
      try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify(arr)); } catch {}
    }
  };

  const handleResetLayout = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("myPaceFlowSizes_") || key.includes("PanelGroup")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    // If in Zen Full, exit first
    if (useFocusStore.getState().isZenFull) {
      useFocusStore.getState().setZenFull(false);
    }
    setSizes(null);
    setResetKey(prev => prev + 1);
  };

  // Exit Zen Full mode via X button or ESC key: restore last good sizes without remounting
  const handleExitZenFull = useCallback(() => {
    setZenFull(false);
    exitFullscreen();
    const restored = lastGoodSizesRef.current;
    // Restore using imperative API — keeps FlowZenZone (and its iframe) mounted
    groupRef.current?.setLayout({
      "todo-panel": restored[0],
      "pomodoro-panel": restored[1],
      "zenzone-panel": restored[2],
    });
    setSizes([...restored]);
    try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify(restored)); } catch {}
  }, [setZenFull, setSizes, layoutKey]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && useFocusStore.getState().isZenFull) {
        handleExitZenFull();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [handleExitZenFull]);

  // Enter Zen Full mode manually via Settings Dropdown
  const handleEnterZenFull = () => {
    if (!isXl) return;
    const store = useFocusStore.getState();
    lastGoodSizesRef.current = [
      sizes?.[0] ?? 20,
      sizes?.[1] ?? 60,
      sizes?.[2] ?? 20,
    ];
    store.setZenFull(true);
    requestFullscreen();
    groupRef.current?.setLayout({
      "todo-panel": 0,
      "pomodoro-panel": 0,
      "zenzone-panel": 100,
    });
  };

  const handleTaskSelect = (task: DailyPlanTask) => {
    if (!dailyPlanToday?.isConfirmed) {
      setPendingTask(task);
      setIsConfirmPlanOpen(true);
      return;
    }
    openFocusMode(task.task.id, task.id, task.task.estimatedMinutes || 25);
  };

  const handleConfirmDailyPlan = async () => {
    if (!dailyPlanToday) { setIsConfirmPlanOpen(false); setPendingTask(null); return; }
    try {
      if (!dailyPlanToday.isConfirmed) await confirmPlan(dailyPlanToday.planDate);
      setIsConfirmPlanOpen(false);
      if (pendingTask) {
        openFocusMode(pendingTask.task.id, pendingTask.id, pendingTask.task.estimatedMinutes || 25);
        setPendingTask(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể chốt daily plan.");
    }
  };

  const handleDeclineDailyPlan = () => { setIsConfirmPlanOpen(false); setPendingTask(null); };

  if (!mounted || !sizes) {
    return <div className="flex h-full w-full bg-background text-foreground overflow-hidden items-center justify-center" />;
  }

  const isConfirmed = !!dailyPlanToday?.isConfirmed;

  if (!isConfirmed) {
    return (
      <div className="h-full w-full bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary animate-pulse">
            <HugeiconsIcon icon={Clock01Icon} size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--card-foreground)' }}>
              {t.flow.noPlanTitle}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.flow.noPlanDesc}</p>
          </div>
          <Button
            size="lg"
            className="rounded-xl px-8 shadow-lg shadow-primary/25 cursor-pointer font-semibold"
            onClick={() => window.location.href = "/"}
          >
            {t.flow.planNowBtn}
          </Button>
        </div>
      </div>
    );
  }

  const todoSize    = isXl ? (sizes[0] ?? 20) : isLg ? (sizes[0] ?? 25) : 0;
  const pomodoroSize = isXl ? (sizes[1] ?? 60) : isLg ? (sizes[1] ?? 75) : (sizes[0] ?? 100);
  const zenzoneSize  = isXl ? (sizes[2] ?? 20) : 0;

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden relative">
      {/* Fix iframe stealing mouse events during resize */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-panel-group-resizing] iframe { pointer-events: none; }
      `}} />

      {/* Settings button */}
      <FlowSettingsDropdown onResetLayout={handleResetLayout} onEnterZenFull={handleEnterZenFull} />

      {/*
        IMPORTANT: ResizablePanelGroup is ALWAYS rendered (never conditionally swapped).
        FlowZenZone lives permanently inside the zenzone panel.
        We use groupRef.setLayout() to expand/collapse panels imperatively,
        which avoids unmounting FlowZenZone and prevents the iframe from reloading.
      */}
      <ResizablePanelGroup
        key={uniqueKey}
        orientation="horizontal"
        onLayoutChanged={handleLayoutChanged}
        groupRef={groupRef}
        className="h-full w-full rounded-lg border-none"
      >
        {/* ── Cột Trái: TODO Today ────────────────────────────────── */}
        {isLg && (
          <>
            <ResizablePanel
              id="todo-panel"
              {...({ order: 1 } as Record<string, unknown>)}
              defaultSize={todoSize}
              minSize={15}
              collapsible={true}
              collapsedSize={0}
              {...({ onCollapse: () => setIsLeftCollapsed(true), onExpand: () => setIsLeftCollapsed(false) } as Record<string, unknown>)}
            >
              <div className={cn(
                "h-full w-full overflow-y-auto transition-opacity duration-700",
                pomodoroState === "focusing" && !isZenFull ? "opacity-20 hover:opacity-100" : ""
              )}>
                <FlowTodoList onTaskSelect={handleTaskSelect} />
              </div>
            </ResizablePanel>

            {/* Left handle: hidden when todo is collapsed OR in Zen Full */}
            <ResizableHandle
              withHandle
              className={cn(
                "transition-all duration-200",
                isLeftCollapsed || isZenFull
                  ? "opacity-0 pointer-events-none !w-0 !min-w-0 !max-w-0 overflow-hidden"
                  : ""
              )}
            />
          </>
        )}

        {/* ── Cột Giữa: Pomodoro Workspace ────────────────────────── */}
        {/*
          collapsible=true is required so setLayout({ "pomodoro-panel": 0 }) works
          when entering Zen Full mode (letting zenzone expand to 100%).
          minSize=25 prevents accidental collapse during normal use.
        */}
        <ResizablePanel
          id="pomodoro-panel"
          {...({ order: 2 } as Record<string, unknown>)}
          defaultSize={pomodoroSize}
          minSize={25}
          collapsible={true}
          collapsedSize={0}
        >
          <div className="h-full w-full relative">
            <div className="h-full w-full flex items-center justify-center overflow-y-auto tour-pomodoro-timer">
              <FlowPomodoro />
            </div>
          </div>
        </ResizablePanel>

        {/* ── Cột Phải: Zen Zone ───────────────────────────────────── */}
        {isXl && (
          <>
            {/* Right handle: shown even in Zen Full mode so user can squeeze to exit */}
            <ResizableHandle
              withHandle
              className={cn(
                "transition-all duration-200",
                isRightCollapsed
                  ? "opacity-0 pointer-events-none !w-0 !min-w-0 !max-w-0 overflow-hidden"
                  : ""
              )}
            />

            <ResizablePanel
              id="zenzone-panel"
              {...({ order: 3 } as Record<string, unknown>)}
              defaultSize={zenzoneSize}
              minSize={15}
              collapsible={true}
              collapsedSize={0}
              {...({ onCollapse: () => setIsRightCollapsed(true), onExpand: () => setIsRightCollapsed(false) } as Record<string, unknown>)}
            >
              {/*
                FlowZenZone is ALWAYS mounted here — the iframe never reloads.
                In Zen Full mode: panel is expanded to 100% via setLayout().
                In normal mode: panel is at its saved size.
              */}
              <div className={cn(
                "h-full w-full overflow-y-auto transition-opacity duration-700",
                pomodoroState === "focusing" && !isZenFull ? "opacity-20 hover:opacity-100" : ""
              )}>
                <FlowZenZone onExit={handleExitZenFull} />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Floating Pomodoro Widget: shown in Zen Full when a task is active AND it is popped out */}
      {isZenFull && activeTaskId && isPomodoroFloating && (
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
      )}

      <ConfirmPlanDialog
        isOpen={isConfirmPlanOpen}
        pendingTask={pendingTask}
        onConfirm={handleConfirmDailyPlan}
        onDecline={handleDeclineDailyPlan}
      />
      <PomodoroSettingsModal />
      <TaskCompletionDurationModal />
    </div>
  );
}
