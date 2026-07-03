import { useBoardStore } from "@/features/board/store/board.store";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function FlowTodoList() {
  const { dailyPlanToday } = useBoardStore();
  const { activeTaskId, pomodoroState, openFocusMode } = useFocusStore();

  const isFocusing = pomodoroState === "focusing";
  
  if (!dailyPlanToday || !dailyPlanToday.tasks || dailyPlanToday.tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 border-r border-[#1e293b] bg-[#0a0f1e]">
        <div className="w-12 h-12 bg-[#0f172a] rounded-full flex items-center justify-center mb-3 shadow-inner">
          <span className="text-xl">📝</span>
        </div>
        <p className="text-sm font-medium">Chưa có công việc nào cho hôm nay.</p>
      </div>
    );
  }

  const mits = dailyPlanToday.tasks.filter(t => t.isMit);
  const regular = dailyPlanToday.tasks.filter(t => !t.isMit);

  const renderTask = (pt: typeof mits[0]) => {
    const isActive = pt.task.id === activeTaskId;
    const isDone = pt.task.status === "Done";

    return (
      <div 
        key={pt.id} 
        onClick={() => {
          if (!isDone) openFocusMode(pt.task.id, pt.id, pt.task.estimatedMinutes || 25);
        }}
        className={cn(
          "p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer group",
          isActive 
            ? "bg-[#0f172a] border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
            : "bg-[#0f172a] border-[#1e293b] hover:border-indigo-500/30 hover:bg-[#131c31]",
          isDone ? "opacity-40 grayscale cursor-default hover:border-[#1e293b] hover:bg-[#0f172a]" : ""
        )}
      >
        <div className="mt-1 shrink-0">
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
            </div>
          ) : isActive ? (
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]">
               <HugeiconsIcon icon={PlayIcon} size={12} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-indigo-400 flex items-center justify-center text-transparent group-hover:text-indigo-400 transition-colors">
               <HugeiconsIcon icon={PlayIcon} size={12} className="ml-0.5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-sm font-medium truncate tracking-wide",
            isDone ? "text-slate-500 line-through" : isActive ? "text-indigo-300" : "text-slate-200"
          )}>
            {pt.task.title}
          </div>
          <div className="flex items-center mt-1.5 space-x-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {pt.task.estimatedMinutes > 0 && (
              <span className="bg-[#0a0f1e] px-1.5 py-0.5 rounded border border-[#1e293b] text-slate-400">
                {pt.task.estimatedMinutes}m
              </span>
            )}
            {pt.task.category && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pt.task.category.color }}></span>
                <span className="truncate text-slate-400">
                  {pt.task.category.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "h-full flex flex-col border-r border-[#1e293b] bg-[#0a0f1e] transition-opacity duration-700",
      isFocusing ? "opacity-30 hover:opacity-100" : "opacity-100"
    )}>
      <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-100 tracking-wide flex items-center">
            Flow
            <span className="relative flex h-2 w-2 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">
            Today: {dailyPlanToday.tasks.length} tasks
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {mits.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest pl-1">Priority</h3>
            <div className="space-y-3">
              {mits.map(renderTask)}
            </div>
          </div>
        )}
        
        {regular.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Upcoming</h3>
            <div className="space-y-3">
              {regular.map(renderTask)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
