import { useBoardStore } from "@/features/board/store/board.store";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";

export function FlowTodoList() {
  const { dailyPlanToday } = useBoardStore();
  const { activeTaskId, pomodoroState, openFocusMode } = useFocusStore();

  const isFocusing = pomodoroState === "focusing";
  
  if (!dailyPlanToday || !dailyPlanToday.tasks || dailyPlanToday.tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 border-r border-slate-800">
        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-3">
          📝
        </div>
        <p className="text-sm">Chưa có công việc nào cho hôm nay.</p>
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
        className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer group
          ${isActive ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}
          ${isDone ? 'opacity-50 grayscale cursor-default' : ''}
        `}
      >
        <div className="mt-1 shrink-0">
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-slate-800 text-green-500 flex items-center justify-center">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
            </div>
          ) : isActive ? (
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
               <HugeiconsIcon icon={PlayIcon} size={12} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-slate-600 group-hover:border-indigo-400 flex items-center justify-center text-transparent group-hover:text-indigo-400">
               <HugeiconsIcon icon={PlayIcon} size={12} className="ml-0.5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isDone ? 'text-slate-500 line-through' : (isActive ? 'text-indigo-300' : 'text-slate-300')}`}>
            {pt.task.title}
          </div>
          <div className="flex items-center mt-1 space-x-2 text-[10px] text-slate-500">
            {pt.task.estimatedMinutes > 0 && (
              <span className="bg-slate-950 px-1.5 py-0.5 rounded">{pt.task.estimatedMinutes}m</span>
            )}
            {pt.task.category && (
              <span style={{ color: pt.task.category.color }} className="truncate">
                {pt.task.category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col border-r border-slate-800 bg-slate-950 transition-opacity duration-500 ${isFocusing ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-semibold text-slate-200">TODO Today</h2>
        <p className="text-xs text-slate-500 mt-1">{dailyPlanToday.tasks.length} tasks scheduled</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {mits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Most Important Tasks</h3>
            <div className="space-y-2">
              {mits.map(renderTask)}
            </div>
          </div>
        )}
        
        {regular.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Other Tasks</h3>
            <div className="space-y-2">
              {regular.map(renderTask)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
