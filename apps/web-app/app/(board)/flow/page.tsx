"use client";

import { useEffect, useState } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro } from "@/features/focus/components/FlowPomodoro";
import { FlowZenZone } from "@/features/focus/components/FlowZenZone";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function FlowPage() {
  const user = useAuthStore((s) => s.user);
  const { fetchTasks, fetchDailyPlanToday, fetchCategories, dailyPlanToday } = useBoardStore();

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const [mounted, setMounted] = useState(false);

  const [resetKey, setResetKey] = useState(0);

  // Fetch data if refreshed directly on /flow
  useEffect(() => {
    setMounted(true);
    if (user && !dailyPlanToday) {
      const d = new Date();
      const currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      fetchCategories();
      fetchTasks();
      fetchDailyPlanToday(currentDate);
    }
  }, [user, dailyPlanToday, fetchTasks, fetchDailyPlanToday, fetchCategories]);

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
    const saved = localStorage.getItem(`myPaceFlowSizes_${layoutKey}`);
    if (saved) {
      try {
        setSizes(JSON.parse(saved));
        return;
      } catch(e) {}
    }
    
    // Defaults if nothing saved
    if (isXl) setSizes([15, 70, 15]);
    else if (isLg) setSizes([25, 75]);
    else setSizes([100]);
  }, [layoutKey, resetKey]);

  const handleLayout = (newSizes: number[]) => {
    if (canSave) {
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
    } catch(e) {}
    setCanSave(false);
    setSizes(null);
    setResetKey(prev => prev + 1);
  };

  if (!mounted || !sizes) {
    return (
      <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden items-center justify-center">
      </div>
    );
  }

  // Map sizes based on current breakpoint
  const todoSize = isXl ? sizes[0] : isLg ? sizes[0] : 0;
  const pomodoroSize = isXl ? sizes[1] : isLg ? sizes[1] : sizes[0];
  const zenzoneSize = isXl ? sizes[2] : 0;

  return (
    <div className="h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Fix iframe stealing mouse events during resize */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-panel-group-resizing] iframe {
          pointer-events: none;
        }
      `}} />

      {/* Reset Layout Button */}
      <button 
        onClick={handleResetLayout}
        className="absolute bottom-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 p-2 rounded-lg shadow-lg border border-slate-700/50 backdrop-blur transition-colors group"
        title="Reset Layout to Default"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
          <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>
        </svg>
      </button>

      {/* @ts-ignore - suppress ts error about direction vs orientation in older shadcn typings */}
      <ResizablePanelGroup key={uniqueKey} onLayout={handleLayout} direction="horizontal" className="h-full w-full rounded-lg border-none">
        
        {/* Cột Trái: TODO Today */}
        {isLg && (
          <>
            <ResizablePanel id="todo-panel" {...({ order: 1 } as any)} defaultSize={todoSize} minSize={10} collapsible={true} collapsedSize={0}>
              <div className="h-full w-full overflow-y-auto">
                 <FlowTodoList />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
          </>
        )}
        
        {/* Cột Giữa: Pomodoro Workspace */}
        <ResizablePanel id="pomodoro-panel" {...({ order: 2 } as any)} defaultSize={pomodoroSize} minSize={20}>
          <div className="h-full w-full flex items-center justify-center overflow-y-auto">
             <FlowPomodoro />
          </div>
        </ResizablePanel>
        
        {/* Cột Phải: Zen Zone */}
        {isXl && (
          <>
            <ResizableHandle withHandle />
            
            <ResizablePanel id="zenzone-panel" {...({ order: 3 } as any)} defaultSize={zenzoneSize} minSize={10} collapsible={true} collapsedSize={0}>
              <div className="h-full w-full overflow-y-auto">
                 <FlowZenZone />
              </div>
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>
    </div>
  );
}
