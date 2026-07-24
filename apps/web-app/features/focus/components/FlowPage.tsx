"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasksAction, updateTaskAction } from "@/features/board/actions/task.action";
import { getDailyPlanAction, confirmPlanAction } from "@/features/board/actions/plan.action";
import { getCategoriesAction } from "@/features/board/actions/category.action";
import { useAppVisibility } from "@/features/available-time";
import { getTodayStr } from "@/lib/date";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro } from "@/features/focus/components/FlowPomodoro";
import { FloatingPomodoroWidget } from "@/features/focus/components/FloatingPomodoroWidget";
import { PomodoroSettingsModal } from "@/features/focus/components/PomodoroSettingsModal";
import { FlowZenZone } from "@/features/focus/components/FlowZenZone";
import { usePomodoro } from "@/features/focus/hooks/usePomodoro";
import { TaskCompletionDurationModal } from "@/features/focus/components/TaskCompletionDurationModal";
import { SwitchTaskConfirmDialog } from "@/features/focus/components/SwitchTaskConfirmDialog";
import { SoundscapeControllerBar } from "@/features/focus/components/SoundscapeControllerBar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FlowSettingsDropdown } from "@/features/focus/components/FlowSettingsDropdown";
import { ConfirmPlanDialog } from "@/features/focus/components/ConfirmPlanDialog";
import { useFlowLayoutState } from "@/features/focus/hooks/useFlowLayoutState";
import { cn } from "@/lib/utils";
import type { DailyPlan, DailyPlanTask } from "@/features/board/types";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";


export function FlowPage() {
  useAppVisibility();
  const { t } = useTranslation();
  usePomodoro();
  const user = useAuthStore((s) => s.user);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const openFocusMode = useFocusStore((s) => s.openFocusMode);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const pauseTimer = useFocusStore((s) => s.pauseTimer);
  const resumeTimer = useFocusStore((s) => s.resumeTimer);
  const closeFocusMode = useFocusStore((s) => s.closeFocusMode);
  const isZenFull = useFocusStore((s) => s.isZenFull);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const queryClient = useQueryClient();
  const currentDate = getTodayStr(user?.timezone);
  
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: getTasksAction, enabled: !!user });
  useQuery({ queryKey: ['categories'], queryFn: getCategoriesAction, enabled: !!user });
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', currentDate], queryFn: () => getDailyPlanAction(currentDate), enabled: !!user });
  
  const confirmPlanMutation = useMutation({
    mutationFn: confirmPlanAction,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['dailyPlan', variables], data);
      useBoardStore.setState({ isStarted: true });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { actualMinutes: number } }) =>
      updateTaskAction(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Also patch the dailyPlan cache immediately so pendingSwitchTask.task.actualMinutes
      // is always fresh — prevents stale alreadyWorkedMinutes on re-open.
      queryClient.setQueryData(['dailyPlan', currentDate], (old: DailyPlan | undefined) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((pt) =>
            pt.task.id === updatedTask.id
              ? { ...pt, task: { ...pt.task, actualMinutes: updatedTask.actualMinutes } }
              : pt
          ),
        };
      });
    },
  });



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
    handleEnterZenFull,
    handleExpandZenZone,
    handleCollapseZenZone
  } = useFlowLayoutState();

  const [isConfirmPlanOpen, setIsConfirmPlanOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<DailyPlanTask | null>(null);

  // Switch-task guard state
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);
  const [pendingSwitchTask, setPendingSwitchTask] = useState<DailyPlanTask | null>(null);
  const [isSavingSwitch, setIsSavingSwitch] = useState(false);
  // Remember the exact pomodoroState before we paused it for the dialog
  const [prevPomodoroState, setPrevPomodoroState] = useState<"focusing" | "breaking" | null>(null);

  useEffect(() => {
    // Only kept for the dependencies if needed
  }, [user]);

  useEffect(() => {
    return () => {
      const state = useFocusStore.getState();
      if (state.pomodoroState === "focusing" || state.pomodoroState === "breaking") {
        state.pauseTimer();
      }
    };
  }, []);

  const doSwitch = (task: DailyPlanTask) => {
    openFocusMode(task.task.id, task.id, task.task.estimatedMinutes || 25, task.task.actualMinutes || 0);
  };

  const handleTaskSelect = (task: DailyPlanTask) => {
    // Ignore click on the currently active task
    if (task.task.id === activeTaskId) return;

    if (!dailyPlanToday?.isConfirmed) {
      setPendingTask(task);
      setIsConfirmPlanOpen(true);
      return;
    }

    const isActiveSession =
      pomodoroState === "focusing" ||
      pomodoroState === "breaking" ||
      pomodoroState === "paused";

    if (isActiveSession && activeTaskId) {
      const wasRunning = pomodoroState === "focusing" || pomodoroState === "breaking";
      if (wasRunning) {
        pauseTimer();
      }
      setPrevPomodoroState(wasRunning ? (pomodoroState as "focusing" | "breaking") : null);
      setPendingSwitchTask(task);
      setIsSwitchDialogOpen(true);
      return;
    }

    doSwitch(task);
  };

  const handleSwitchCancel = () => {
    setIsSwitchDialogOpen(false);
    setPendingSwitchTask(null);
    // Resume timer if it was actively running before we paused it for the dialog
    if (prevPomodoroState) {
      resumeTimer(prevPomodoroState);
    }
    setPrevPomodoroState(null);
  };

  const handleSwitchDiscard = () => {
    setIsSwitchDialogOpen(false);
    if (!pendingSwitchTask) return;
    const next = pendingSwitchTask;
    setPendingSwitchTask(null);
    closeFocusMode();
    doSwitch(next);
  };

  const handleSwitchSaveAndSwitch = async () => {
    if (!pendingSwitchTask || !activeTaskId || isSavingSwitch) return;
    setIsSavingSwitch(true);
    try {
      const accumulatedFocusTime = useFocusStore.getState().accumulatedFocusTime;
      const actualMinutes = Math.floor(accumulatedFocusTime / 60);
      if (actualMinutes > 0) {
        await updateTaskMutation.mutateAsync({ id: activeTaskId, data: { actualMinutes } });
      }
      setIsSwitchDialogOpen(false);
      const next = pendingSwitchTask;
      setPendingSwitchTask(null);
      closeFocusMode();
      doSwitch(next);
    } catch (err) {
      console.error(err);
      toast.error("Không thể lưu tiến trình.");
    } finally {
      setIsSavingSwitch(false);
    }
  };

  const handleConfirmDailyPlan = async () => {
    if (!dailyPlanToday) { setIsConfirmPlanOpen(false); setPendingTask(null); return; }
    try {
      if (!dailyPlanToday.isConfirmed) await confirmPlanMutation.mutateAsync(dailyPlanToday.planDate);
      setIsConfirmPlanOpen(false);
      if (pendingTask) {
        openFocusMode(pendingTask.task.id, pendingTask.id, pendingTask.task.estimatedMinutes || 25, pendingTask.task.actualMinutes || 0);
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
    <div className={cn(
      "h-full w-full text-foreground overflow-hidden flex flex-col relative transition-colors duration-300",
      isVideoBackground ? "bg-transparent" : "bg-background"
    )}>
      <div className="flex-1 min-h-0 relative">
        {/* Fix iframe stealing mouse events during resize, and prevent collapsed panel display:none */}
        <style dangerouslySetInnerHTML={{__html: `
          [data-panel-group-resizing] iframe { pointer-events: none; }
          #zenzone-panel[data-state="collapsed"] {
            display: block !important;
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0.001 !important;
            pointer-events: none !important;
            overflow: hidden !important;
            z-index: -9999 !important;
          }
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
                "relative z-10 h-full w-full overflow-y-auto transition-opacity duration-700",
                pomodoroState === "focusing" && !isZenFull ? "opacity-40 hover:opacity-100" : ""
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
          <div className="h-full w-full relative z-10">
            <div className="h-full w-full flex items-center justify-center overflow-y-auto">
              <FlowPomodoro />
            </div>
          </div>
        </ResizablePanel>

        {/* ── Cột Phải: Zen Zone ───────────────────────────────────── */}
        {/* Right handle: shown even in Zen Full mode so user can squeeze to exit */}
        {isXl && (
          <ResizableHandle
            withHandle
            className={cn(
              "transition-all duration-200",
              isRightCollapsed
                ? "opacity-0 pointer-events-none !w-0 !min-w-0 !max-w-0 overflow-hidden"
                : ""
            )}
          />
        )}

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
            "relative z-10 h-full w-full overflow-y-auto transition-opacity duration-700",
            pomodoroState === "focusing" && !isZenFull && !isVideoBackground ? "opacity-40 hover:opacity-100" : ""
          )}>
            <FlowZenZone onExit={handleExitZenFull} onCollapse={handleCollapseZenZone} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      </div>

      {isRightCollapsed && (
        <SoundscapeControllerBar onExpandZenZone={handleExpandZenZone} />
      )}

      {/* Floating Pomodoro Widget: shown in Zen Full when a task is active AND it is popped out */}
      <FloatingPomodoroWidget />

      <ConfirmPlanDialog
        isOpen={isConfirmPlanOpen}
        pendingTask={pendingTask}
        onConfirm={handleConfirmDailyPlan}
        onDecline={handleDeclineDailyPlan}
      />
      <SwitchTaskConfirmDialog
        isOpen={isSwitchDialogOpen}
        currentTaskTitle={tasks.find((t) => t.id === activeTaskId)?.title ?? ""}
        pendingTask={pendingSwitchTask}
        isSaving={isSavingSwitch}
        onCancel={handleSwitchCancel}
        onDiscard={handleSwitchDiscard}
        onSaveAndSwitch={handleSwitchSaveAndSwitch}
      />
      <PomodoroSettingsModal />
      <TaskCompletionDurationModal />
    </div>
  );
}
