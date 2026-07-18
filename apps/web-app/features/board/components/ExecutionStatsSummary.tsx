import { Button } from "@/components/ui/button";
import type { AvailableTimeData } from "@/features/available-time/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface ExecutionStatsSummaryProps {
  currentAvailable: number;
  totalAvailable: number;
  availableData: AvailableTimeData | null;
  activeTab: string;
  isStarted: boolean;
  onEditPlan: () => void;
}

export function ExecutionStatsSummary({
  currentAvailable,
  totalAvailable,
  availableData,
  activeTab,
  isStarted,
  onEditPlan,
}: ExecutionStatsSummaryProps) {
  const { t } = useTranslation();

  const totalFree = availableData ? (availableData.workingWindowMinutes - availableData.blockedMinutes) : 0;
  const bufferMins = availableData ? Math.round(totalFree * (availableData.bufferPct / 100)) : 0;
  const showStats = availableData && totalFree > 0;
  const usedTime = Math.max(0, totalAvailable - currentAvailable);

  const isOverscheduled = usedTime > totalAvailable;
  const availableWidth = totalFree > 0 ? (totalAvailable / totalFree) * 100 : 0;
  const bufferWidth = totalFree > 0 ? (bufferMins / totalFree) * 100 : 0;
  const progressPct = totalFree > 0 ? (Math.min(totalFree, usedTime) / totalFree) * 100 : 0;

  return (
    <div className="flex justify-between items-center border-b border-border pb-4">
      <div className="space-y-1 w-full max-w-md">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`text-xs uppercase tracking-wider font-semibold ${currentAvailable < 0 ? "text-red-500" : "text-muted-foreground"}`}>
            {t.execution.remainingAvailable}
          </div>
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
                    <span className="font-bold text-foreground pt-1.5 border-t border-border mt-0.5 text-right">{Math.floor(totalAvailable / 60)}h {totalAvailable % 60}m</span>

                    <span className="text-muted-foreground">{t.planning.scheduledTasks || "Công việc đã xếp:"}</span>
                    <span className="font-medium text-amber-500 text-right">-{Math.floor(usedTime / 60)}h {usedTime % 60}m</span>

                    <span className="text-muted-foreground font-bold pt-1.5 border-t border-border mt-0.5">{t.execution.remainingAvailable}</span>
                    <span className={`font-bold pt-1.5 border-t border-border mt-0.5 text-right ${currentAvailable < 0 ? 'text-red-500' : 'text-primary'}`}>
                      {currentAvailable < 0 ? "-" : ""}{Math.floor(Math.abs(currentAvailable) / 60)}h {Math.abs(currentAvailable) % 60}m
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2 text-foreground">
            <span className={`text-3xl font-black tracking-tight ${currentAvailable < 0 ? "text-red-500" : ""}`}>
              {currentAvailable < 0 ? "-" : ""}{Math.floor(Math.abs(currentAvailable) / 60)}h {Math.abs(currentAvailable) % 60}m
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              / {t.execution.total}: {Math.floor(totalAvailable / 60)}h {totalAvailable % 60}m
            </span>
          </div>
          {(!isStarted || activeTab === 'tomorrow') && (
            <Button variant="outline" size="sm" onClick={onEditPlan} className="border-border text-foreground cursor-pointer shrink-0">
              {activeTab === 'today' ? t.board.editMyDay : t.board.editTomorrow}
            </Button>
          )}
        </div>
        {showStats && (
          <div className="pt-2">
            <div className="relative w-full h-2.5">
              <div className="absolute inset-0 bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
                {availableWidth > 0 && (
                  <div 
                    className="bg-primary hover:bg-primary/90 transition-all duration-500" 
                    style={{ width: `${availableWidth}%` }}
                    title={t.execution.availableTitle(`${Math.floor(totalAvailable / 60)}h ${totalAvailable % 60}m`)}
                  />
                )}
                {bufferWidth > 0 && (
                  <div 
                    className="bg-amber-500/80 hover:bg-amber-500 transition-all duration-500" 
                    style={{ width: `${bufferWidth}%` }}
                    title={t.execution.bufferTitle(availableData.bufferPct, `${Math.floor(bufferMins / 60)}h ${bufferMins % 60}m`)}
                  />
                )}
              </div>

              {/* Progress indicator dot */}
              {totalFree > 0 && (
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all duration-500 ease-out z-10 ${
                    isOverscheduled 
                      ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" 
                      : "bg-white"
                  }`}
                  style={{ left: `${progressPct}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
