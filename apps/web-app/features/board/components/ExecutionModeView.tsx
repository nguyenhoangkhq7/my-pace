import { Button } from "@/components/ui/button";
import { DailyPlan } from "../types";
import { ExecutionTaskItem } from "./ExecutionTaskItem";
import type { AvailableTimeData } from "@/features/available-time/types";

interface ExecutionModeViewProps {
  currentPlan: DailyPlan;
  currentAvailable: number;
  availableData: AvailableTimeData | null;
  activeTab: string;
  isStarted: boolean;
  onEditPlan: () => void;
  onStartMyDay: () => void;
  onCancelPlan: () => void;
}

export function ExecutionModeView({
  currentPlan,
  currentAvailable,
  availableData,
  activeTab,
  isStarted,
  onEditPlan,
  onStartMyDay,
  onCancelPlan,
}: ExecutionModeViewProps) {
  const tasksList = currentPlan.tasks || [];

  if (tasksList.length === 0) {
    return null;
  }

  // Celebration state
  if (activeTab === 'today' && tasksList.every(t => t.task.status === "Done")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <span className="text-lg">🎉 Bạn đã hoàn thành tất cả công việc cho hôm nay. Tuyệt vời!</span>
      </div>
    );
  }

  const mits = tasksList.filter(t => t.isMit);
  const regular = tasksList.filter(t => !t.isMit);

  const totalFree = availableData ? (availableData.workingWindowMinutes - availableData.blockedMinutes) : 0;
  const bufferMins = availableData ? Math.round(totalFree * (availableData.bufferPct / 100)) : 0;
  const showStats = availableData && totalFree > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Tổng thời gian thực khả dụng</div>
          <div className="text-lg font-bold text-foreground">
            {Math.floor(currentAvailable / 60)}h {currentAvailable % 60}m
          </div>
          {showStats && (
            <div className="flex gap-x-3 text-[10px] text-muted-foreground pt-0.5">
              <span>Tổng thời gian: <strong className="text-slate-300">{Math.floor(totalFree / 60)}h {totalFree % 60}m</strong></span>
              <span>•</span>
              <span>Thời gian đệm ({availableData.bufferPct}%): <strong className="text-slate-300">{Math.floor(bufferMins / 60)}h {bufferMins % 60}m</strong></span>
            </div>
          )}
        </div>
        {(!isStarted || activeTab === 'tomorrow') && (
          <Button variant="outline" size="sm" onClick={onEditPlan} className="border-border text-foreground cursor-pointer">
            Edit {activeTab === 'today' ? 'My Day' : 'Tomorrow'}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {mits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Important Tasks (MITs)</h3>
            {mits.map(pt => (
              <ExecutionTaskItem
                key={pt.id}
                task={pt.task}
                isMit={pt.isMit}
                isConfirmed={currentPlan.isConfirmed}
              />
            ))}
          </div>
        )}
        
        {regular.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Tasks</h3>
            {regular.map(pt => (
              <ExecutionTaskItem
                key={pt.id}
                task={pt.task}
                isMit={pt.isMit}
                isConfirmed={currentPlan.isConfirmed}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border flex flex-col gap-2">
        {activeTab === 'today' ? (
          !isStarted ? (
            <>
              <Button
                onClick={onStartMyDay}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                🚀 Start My Day
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelPlan} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer">
                Cancel Plan
              </Button>
            </>
          ) : (
            <div className="text-center text-xs text-green-500/90 font-medium py-2 bg-green-500/5 rounded-xl border border-green-500/10">
              ✓ Kế hoạch hôm nay đang thực thi
            </div>
          )
        ) : (
          <Button variant="ghost" size="sm" onClick={onCancelPlan} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer">
            Cancel Plan
          </Button>
        )}
      </div>
    </div>
  );
}
