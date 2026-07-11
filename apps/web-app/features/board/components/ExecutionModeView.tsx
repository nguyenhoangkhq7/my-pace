import { Button } from "@/components/ui/button";
import { DailyPlan } from "../types";
import { ExecutionTaskItem } from "./ExecutionTaskItem";
import type { AvailableTimeData } from "@/features/available-time/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();
  const tasksList = currentPlan.tasks || [];

  if (tasksList.length === 0) {
    return null;
  }

  // Celebration state
  if (activeTab === 'today' && tasksList.every(t => t.task.status === "Done")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <span className="text-lg">{t.board.allDoneToday}</span>
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
        <div className="space-y-1 w-full max-w-md">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.execution.totalAvailable}</div>
            {showStats && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors outline-none cursor-pointer flex items-center justify-center">
                      <HugeiconsIcon icon={InformationCircleIcon} size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="p-3 bg-card text-card-foreground border border-border shadow-lg">
                    <p className="font-semibold text-xs border-b border-border pb-1.5 mb-1.5 text-foreground">{t.execution.howAvailable}</p>
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs">
                      <span className="text-muted-foreground">{t.execution.totalFreeTime}</span>
                      <span className="font-medium text-right text-foreground">{Math.floor(totalFree / 60)}h {totalFree % 60}m</span>
                      
                      <span className="text-muted-foreground">{t.execution.bufferDeducted(availableData.bufferPct)}</span>
                      <span className="font-medium text-amber-500 text-right">-{Math.floor(bufferMins / 60)}h {bufferMins % 60}m</span>
                      
                      <span className="text-muted-foreground font-medium pt-1.5 border-t border-border mt-0.5">{t.execution.availableToWork}</span>
                      <span className="font-bold text-primary pt-1.5 border-t border-border mt-0.5 text-right">{Math.floor(currentAvailable / 60)}h {currentAvailable % 60}m</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black text-foreground tracking-tight">
              {Math.floor(currentAvailable / 60)}h {currentAvailable % 60}m
            </div>
            {(!isStarted || activeTab === 'tomorrow') && (
              <Button variant="outline" size="sm" onClick={onEditPlan} className="border-border text-foreground cursor-pointer shrink-0">
                {activeTab === 'today' ? t.board.editMyDay : t.board.editTomorrow}
              </Button>
            )}
          </div>
          {showStats && (
            <div className="pt-2">
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="bg-primary hover:bg-primary/90 transition-all duration-500" 
                  style={{ width: `${(currentAvailable / totalFree) * 100}%` }}
                  title={t.execution.availableTitle(`${Math.floor(currentAvailable / 60)}h ${currentAvailable % 60}m`)}
                />
                <div 
                  className="bg-amber-500/80 hover:bg-amber-500 transition-all duration-500" 
                  style={{ width: `${(bufferMins / totalFree) * 100}%` }}
                  title={t.execution.bufferTitle(availableData.bufferPct, `${Math.floor(bufferMins / 60)}h ${bufferMins % 60}m`)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {mits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.planning.mits}</h3>
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
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.planning.otherTasks}</h3>
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
                {t.board.startMyDay}
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelPlan} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer">
                {t.board.cancelPlan}
              </Button>
            </>
          ) : (
            <div className="text-center text-xs text-green-500/90 font-medium py-2 bg-green-500/5 rounded-xl border border-green-500/10">
              {t.board.planConfirmed}
            </div>
          )
        ) : (
          <Button variant="ghost" size="sm" onClick={onCancelPlan} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer">
            {t.board.cancelPlan}
          </Button>
        )}
      </div>
    </div>
  );
}
