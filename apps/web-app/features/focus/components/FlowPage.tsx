"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro } from "@/features/focus/components/FlowPomodoro";
import { PomodoroSettingsModal } from "@/features/focus/components/PomodoroSettingsModal";
import { FlowZenZone } from "@/features/focus/components/FlowZenZone";
import { TaskCompletionDurationModal } from "@/features/focus/components/TaskCompletionDurationModal";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FlowSettingsDropdown } from "@/features/focus/components/FlowSettingsDropdown";
import { ConfirmPlanDialog } from "@/features/focus/components/ConfirmPlanDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { DailyPlanTask } from "@/features/board/types";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";

export function FlowPage() {
  const user = useAuthStore((s) => s.user);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const openFocusMode = useFocusStore((s) => s.openFocusMode);
  const isZenMaximized = useFocusStore((s) => s.isZenMaximized);
  const confirmPlan = useBoardStore((s) => s.confirmPlan);
  const { fetchTasks, fetchDailyPlanToday, fetchCategories, dailyPlanToday } = useBoardStore();

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const [mounted, setMounted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isConfirmPlanOpen, setIsConfirmPlanOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<DailyPlanTask | null>(null);

  // Fetch data on mount
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

  // Auto-pause on unmount
  useEffect(() => {
    return () => {
      // Use useFocusStore.getState() to avoid dependency issues on unmount
      const state = useFocusStore.getState();
      if (state.pomodoroState === "focusing" || state.pomodoroState === "breaking") {
        state.pauseTimer();
      }
    };
  }, []);

  const layoutKey = isXl ? "layout-xl" : isLg ? "layout-lg" : "layout-base";
  const uniqueKey = `${layoutKey}-${resetKey}`;
  
  const [sizes, setSizes] = useState<number[] | null>(null);
  const [canSave, setCanSave] = useState(false);

  // Prevent onLayout from firing immediately on mount and overwriting saved sizes
  useEffect(() => {
    if (sizes) {
      const t = setTimeout(() => setCanSave(true), 1000);
      return () => clearTimeout(t);
    }
  }, [sizes]);

  // Read sizes from localStorage when layout breakpoint changes
  useEffect(() => {
    const expectedLen = isXl ? 3 : isLg ? 2 : 1;

    Promise.resolve().then(() => {
      const saved = localStorage.getItem(`myPaceFlowSizes_${layoutKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 3 && parsed[0] === 15 && parsed[1] === 70 && parsed[2] === 15) {
            setSizes([20, 60, 20]);
            localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify([20, 60, 20]));
            return;
          }
          if (Array.isArray(parsed) && parsed.length === expectedLen) {
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

  const handleLayout = (newSizes: number[]) => {
    // Only save if the number of reported panels matches what we expect for the
    // current breakpoint.  During a zoom-triggered remount, react-resizable-panels
    // can fire onLayout with stale / partial sizes that would corrupt the store.
    const expectedLen = isXl ? 3 : isLg ? 2 : 1;
    if (canSave && newSizes.length === expectedLen) {
      localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify(newSizes));
    }
  };

  const handleResetLayout = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("myPaceFlowSizes_") || key.includes("layout-xl") || key.includes("layout-lg") || key.includes("layout-base") || key.includes("PanelGroup")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    setCanSave(false);
    setSizes(null);
    setResetKey(prev => prev + 1);
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
    if (!dailyPlanToday) {
      setIsConfirmPlanOpen(false);
      setPendingTask(null);
      return;
    }

    try {
      if (!dailyPlanToday.isConfirmed) {
        await confirmPlan(dailyPlanToday.planDate);
      }

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

  const handleDeclineDailyPlan = () => {
    setIsConfirmPlanOpen(false);
    setPendingTask(null);
  };

  if (!mounted || !sizes) {
    return (
      <div className="flex h-full w-full bg-background text-foreground overflow-hidden items-center justify-center">
      </div>
    );
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
              Bạn chưa lên kế hoạch cho hôm nay
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Để bắt đầu làm việc tập trung (Flow), bạn cần lên lịch công việc và nhấn bắt đầu ngày mới (Start My Day) trước.
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-xl px-8 shadow-lg shadow-primary/25 cursor-pointer font-semibold"
            onClick={() => window.location.href = "/"}
          >
            Lên kế hoạch ngay (Plan my day)
          </Button>
        </div>
      </div>
    );
  }

  // Map sizes based on current breakpoint
  // Use ?? fallbacks so defaultSize is never undefined (undefined causes
  // react-resizable-panels to behave unpredictably on remount).
  const todoSize = isXl ? (sizes[0] ?? 20) : isLg ? (sizes[0] ?? 25) : 0;
  const pomodoroSize = isXl ? (sizes[1] ?? 60) : isLg ? (sizes[1] ?? 75) : (sizes[0] ?? 100);
  const zenzoneSize = isXl ? (sizes[2] ?? 20) : 0;

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden relative">
      {/* Fix iframe stealing mouse events during resize */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-panel-group-resizing] iframe {
          pointer-events: none;
        }
      `}} />

      {/* Combined Settings Button (Dropdown Menu) */}
      <FlowSettingsDropdown onResetLayout={handleResetLayout} />

      {/* @ts-expect-error - suppress ts error about direction vs orientation in older shadcn typings */}
      <ResizablePanelGroup key={uniqueKey} onLayout={handleLayout} direction="horizontal" className="h-full w-full rounded-lg border-none">
        
        {/* Cột Trái: TODO Today */}
        {isLg && !isZenMaximized && (
          <>
            <ResizablePanel 
              id="todo-panel" 
              {...({ order: 1 } as Record<string, unknown>)} 
              defaultSize={todoSize} 
              minSize={10} 
              collapsible={true} 
              collapsedSize={0}
              {...({ onCollapse: () => setIsLeftCollapsed(true), onExpand: () => setIsLeftCollapsed(false) } as Record<string, unknown>)}
            >
              <div className={cn("h-full w-full overflow-y-auto transition-opacity duration-700", pomodoroState === "focusing" ? "opacity-20 hover:opacity-100" : "")}>
                  <FlowTodoList onTaskSelect={handleTaskSelect} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle 
              withHandle 
              className={cn(
                "transition-all duration-200",
                isLeftCollapsed ? "opacity-0 pointer-events-none !w-0 !min-w-0 !max-w-0 overflow-hidden" : ""
              )}
            />
          </>
        )}
        
        {/* Cột Giữa: Pomodoro Workspace */}
        {!isZenMaximized && (
          <ResizablePanel id="pomodoro-panel" {...({ order: 2 } as Record<string, unknown>)} defaultSize={pomodoroSize} minSize={25}>
            <div className="h-full w-full relative">
              <div className="h-full w-full flex items-center justify-center overflow-y-auto">
                <FlowPomodoro />
              </div>
            </div>
          </ResizablePanel>
        )}
        
        {/* Cột Phải: Zen Zone */}
        {isXl && (
          <>
            <ResizableHandle 
              withHandle 
              className={cn(
                "transition-all duration-200",
                isRightCollapsed || isZenMaximized ? "opacity-0 pointer-events-none !w-0 !min-w-0 !max-w-0 overflow-hidden" : ""
              )}
            />
            
            <ResizablePanel 
              id="zenzone-panel" 
              {...({ order: 3 } as Record<string, unknown>)} 
              defaultSize={isZenMaximized ? 100 : zenzoneSize} 
              minSize={isZenMaximized ? 100 : 10} 
              collapsible={!isZenMaximized} 
              collapsedSize={0}
              {...({ onCollapse: () => setIsRightCollapsed(true), onExpand: () => setIsRightCollapsed(false) } as Record<string, unknown>)}
            >
              <div className={cn("h-full w-full overflow-y-auto transition-opacity duration-700", pomodoroState === "focusing" && !isZenMaximized ? "opacity-20 hover:opacity-100" : "")}>
                 <FlowZenZone />
              </div>
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>

      {/* Daily Plan confirmation modal dialog */}
      <ConfirmPlanDialog
        isOpen={isConfirmPlanOpen}
        pendingTask={pendingTask}
        onConfirm={handleConfirmDailyPlan}
        onDecline={handleDeclineDailyPlan}
      />
      
      {/* Settings Modal is global to the Flow page */}
      <PomodoroSettingsModal />

      {/* Micro-modal for completed task actual time entry */}
      <TaskCompletionDurationModal />
    </div>
  );
}
