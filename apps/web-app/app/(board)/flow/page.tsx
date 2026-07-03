"use client";

import { useEffect, useState, useRef } from "react";
import { PanelImperativeHandle } from "react-resizable-panels";
import { ChevronLeft, ChevronRight, Settings2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { useBoardStore } from "@/features/board/store/board.store";
import { FlowTodoList } from "@/features/focus/components/FlowTodoList";
import { FlowPomodoro, PomodoroSettingsModal } from "@/features/focus/components/FlowPomodoro";
import { FlowZenZone } from "@/features/focus/components/FlowZenZone";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export default function FlowPage() {
  const user = useAuthStore((s) => s.user);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const { fetchTasks, fetchDailyPlanToday, fetchCategories, dailyPlanToday } = useBoardStore();

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const [mounted, setMounted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const leftPanelRef = useRef<PanelImperativeHandle>(null);
  const rightPanelRef = useRef<PanelImperativeHandle>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  
  const leftPanelPrevSize = useRef<number>(isXl ? 20 : 25);
  const rightPanelPrevSize = useRef<number>(20);

  const toggleLeftPanel = () => {
    if (isLeftCollapsed) {
      leftPanelRef.current?.resize(isXl ? 20 : 25);
      setIsLeftCollapsed(false);
    } else {
      leftPanelRef.current?.collapse();
      setIsLeftCollapsed(true);
    }
  };

  const toggleRightPanel = () => {
    if (isRightCollapsed) {
      rightPanelRef.current?.resize(20);
      setIsRightCollapsed(false);
    } else {
      rightPanelRef.current?.collapse();
      setIsRightCollapsed(true);
    }
  };

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
        const parsed = JSON.parse(saved);
        // Migrate old 15/70/15 default to new 20/60/20 layout
        if (Array.isArray(parsed) && parsed.length === 3 && parsed[0] === 15 && parsed[1] === 70 && parsed[2] === 15) {
          setSizes([20, 60, 20]);
          localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify([20, 60, 20]));
          return;
        }
        setSizes(parsed);
        return;
      } catch(e) {}
    }
    
    // Defaults if nothing saved
    if (isXl) setSizes([20, 60, 20]);
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
      <div className="flex h-full w-full bg-[#0a0f1e] text-slate-100 overflow-hidden items-center justify-center">
      </div>
    );
  }

  // Map sizes based on current breakpoint
  const todoSize = isXl ? sizes[0] : isLg ? sizes[0] : 0;
  const pomodoroSize = isXl ? sizes[1] : isLg ? sizes[1] : sizes[0];
  const zenzoneSize = isXl ? sizes[2] : 0;

  return (
    <div className="h-full w-full bg-[#0a0f1e] text-slate-100 overflow-hidden relative">
      {/* Fix iframe stealing mouse events during resize */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-panel-group-resizing] iframe {
          pointer-events: none;
        }
      `}} />

      {/* Combined Settings Button (Dropdown Menu) */}
      <div className="absolute bottom-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 p-2.5 rounded-lg shadow-lg border border-slate-700/50 backdrop-blur transition-all active:scale-95 cursor-pointer"
              title="Cài đặt & Giao diện"
            >
              <Settings2 className="w-4.5 h-4.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0f172a] border-[#1e293b] text-slate-200 shadow-xl min-w-44">
            <DropdownMenuItem 
              onClick={() => useFocusStore.getState().setIsSettingsOpen(true)}
              className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-slate-300 hover:text-slate-100"
            >
              <Settings2 className="w-4 h-4 text-slate-400" /> Cấu hình Pomodoro
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleResetLayout}
              className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-rose-400 hover:text-rose-300"
            >
              <RefreshCw className="w-4 h-4 text-rose-400" /> Reset giao diện
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* @ts-ignore - suppress ts error about direction vs orientation in older shadcn typings */}
      <ResizablePanelGroup key={uniqueKey} onLayout={handleLayout} direction="horizontal" className="h-full w-full rounded-lg border-none">
        
        {/* Cột Trái: TODO Today */}
        {isLg && (
          <>
            <ResizablePanel 
              ref={leftPanelRef}
              id="todo-panel" 
              {...({ order: 1 } as any)} 
              defaultSize={todoSize} 
              minSize={10} 
              collapsible={true} 
              collapsedSize={0}
              onCollapse={() => setIsLeftCollapsed(true)}
              onExpand={() => setIsLeftCollapsed(false)}
            >
              <div className={cn("h-full w-full overflow-y-auto transition-opacity duration-700", pomodoroState === "focusing" ? "opacity-20 hover:opacity-100" : "")}>
                 <FlowTodoList />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
          </>
        )}
        
        {/* Cột Giữa: Pomodoro Workspace */}
        <ResizablePanel id="pomodoro-panel" {...({ order: 2 } as any)} defaultSize={pomodoroSize} minSize={20}>
          <div className="h-full w-full relative">
            {isLg && (
              <button 
                onClick={toggleLeftPanel}
                className="absolute left-4 top-4 z-50 p-1.5 bg-[#0f172a]/50 hover:bg-[#1e293b] text-slate-500 hover:text-slate-300 border border-[#1e293b] rounded-lg shadow-md opacity-20 hover:opacity-100 transition-all cursor-pointer"
                title={isLeftCollapsed ? "Mở danh sách công việc" : "Thu gọn danh sách công việc"}
              >
                {isLeftCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
              </button>
            )}
 
            <div className="h-full w-full flex items-center justify-center overflow-y-auto">
              <FlowPomodoro />
            </div>
 
            {isXl && (
              <button 
                onClick={toggleRightPanel}
                className="absolute right-4 top-4 z-50 p-1.5 bg-[#0f172a]/50 hover:bg-[#1e293b] text-slate-500 hover:text-slate-300 border border-[#1e293b] rounded-lg shadow-md opacity-20 hover:opacity-100 transition-all cursor-pointer"
                title={isRightCollapsed ? "Mở Zen Zone" : "Thu gọn Zen Zone"}
              >
                {isRightCollapsed ? <ChevronLeft className="w-4.5 h-4.5" /> : <ChevronRight className="w-4.5 h-4.5" />}
              </button>
            )}
          </div>
        </ResizablePanel>
        
        {/* Cột Phải: Zen Zone */}
        {isXl && (
          <>
            <ResizableHandle withHandle />
            
            <ResizablePanel 
              ref={rightPanelRef}
              id="zenzone-panel" 
              {...({ order: 3 } as any)} 
              defaultSize={zenzoneSize} 
              minSize={10} 
              collapsible={true} 
              collapsedSize={0}
              onCollapse={() => setIsRightCollapsed(true)}
              onExpand={() => setIsRightCollapsed(false)}
            >
              <div className={cn("h-full w-full overflow-y-auto transition-opacity duration-700", pomodoroState === "focusing" ? "opacity-20 hover:opacity-100" : "")}>
                 <FlowZenZone />
              </div>
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>
      
      {/* Settings Modal is global to the Flow page */}
      <PomodoroSettingsModal />
    </div>
  );
}
