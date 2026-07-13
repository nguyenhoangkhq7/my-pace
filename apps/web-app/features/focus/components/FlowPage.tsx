"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { useAppVisibility } from "@/features/available-time";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro } from "@/features/focus/components/FlowPomodoro";
import { FloatingPomodoroWidget } from "@/features/focus/components/FloatingPomodoroWidget";
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
import { useFlowLayoutState } from "@/features/focus/hooks/useFlowLayoutState";
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

  const {
    isLg,
    isXl,
    mounted,
    resetKey,
    sizes,
    isLeftCollapsed,
    setIsLeftCollapsed,
    isRightCollapsed,
    setIsRightCollapsed,
    groupRef,
    handleLayoutChanged,
    handleResetLayout,
    handleExitZenFull,
    handleEnterZenFull
  } = useFlowLayoutState();

  const [isConfirmPlanOpen, setIsConfirmPlanOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<DailyPlanTask | null>(null);

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
        key={`layout-${isXl ? "xl" : isLg ? "lg" : "base"}-${resetKey}`}
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
            <div className="h-full w-full flex items-center justify-center overflow-y-auto">
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
      <FloatingPomodoroWidget />

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
