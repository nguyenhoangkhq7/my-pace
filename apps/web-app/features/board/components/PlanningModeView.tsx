import { Button } from "@/components/ui/button";
import { Task } from "../types";
import { PlanningTaskItem } from "./PlanningTaskItem";

import type { AvailableTimeData } from "@/features/available-time/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface PlanningModeViewProps {
  currentAvailable: number;
  availableData: AvailableTimeData | null;
  plannedTaskIds: string[];
  tasks: Task[];
  onCancel: () => void;
  onSave: () => void;
  onRemoveTask: (taskId: string) => void;
}

export function PlanningModeView({
  currentAvailable,
  availableData,
  plannedTaskIds,
  tasks,
  onCancel,
  onSave,
  onRemoveTask,
}: PlanningModeViewProps) {
  const { t } = useTranslation();
  const plannedTasks = plannedTaskIds
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean) as Task[];

  const mits = plannedTasks.filter(t => t.isImportant);
  const regularTasks = plannedTasks.filter(t => !t.isImportant);

  const baseAvailable = availableData?.availableMinutes || 0;
  const usedTime = Math.max(0, baseAvailable - currentAvailable);
  const overscheduled = usedTime > baseAvailable;
  
  const usedPct = baseAvailable > 0 ? Math.min(100, (usedTime / baseAvailable) * 100) : 0;
  const remPct = baseAvailable > 0 ? Math.max(0, (currentAvailable / baseAvailable) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col gap-4">
        <div className="space-y-1 w-full">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="text-xs text-primary/80 font-bold uppercase tracking-wider">{t.planning.remainingTime}</div>
            {baseAvailable > 0 && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button className="text-primary/50 hover:text-primary transition-colors outline-none cursor-pointer flex items-center justify-center">
                      <HugeiconsIcon icon={InformationCircleIcon} size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="p-3 bg-card text-card-foreground border border-border shadow-lg">
                    <p className="font-semibold text-xs border-b border-border pb-1.5 mb-1.5 text-foreground">{t.planning.howTimeCalculated}</p>
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs">
                      <span className="text-muted-foreground">{t.planning.totalBudget}</span>
                      <span className="font-medium text-right text-foreground">{Math.floor(baseAvailable / 60)}h {baseAvailable % 60}m</span>
                      
                      <span className="text-muted-foreground">{t.planning.scheduledTasks}</span>
                      <span className="font-medium text-amber-500 text-right">-{Math.floor(usedTime / 60)}h {usedTime % 60}m</span>
                      
                      <span className="text-muted-foreground font-medium pt-1.5 border-t border-border mt-0.5">{t.planning.remaining}</span>
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
            <div className={`text-3xl font-black tracking-tight ${currentAvailable < 0 ? 'text-red-500' : 'text-primary'}`}>
              {currentAvailable < 0 ? "-" : ""}{Math.floor(Math.abs(currentAvailable) / 60)}h {Math.abs(currentAvailable) % 60}m
            </div>
            <div className="flex space-x-2 shrink-0">
              <Button variant="outline" size="sm" onClick={onCancel} className="border-primary/20 text-foreground hover:bg-primary/10 cursor-pointer">
                {t.common.cancel}
              </Button>
              <Button size="sm" onClick={onSave} className="bg-primary text-primary-foreground cursor-pointer shadow-md shadow-primary/20 tour-save-plan-btn">
                {t.planning.savePlan}
              </Button>
            </div>
          </div>
        </div>

        {baseAvailable > 0 && (
          <div className="pt-1">
            <div className="h-2.5 w-full bg-muted/80 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className={`${overscheduled ? 'bg-red-500' : 'bg-primary'} transition-all duration-500`}
                style={{ width: `${usedPct}%` }}
                title={t.planning.scheduledTitle(`${Math.floor(usedTime / 60)}h ${usedTime % 60}m`)}
              />
              <div 
                className="bg-muted/50 transition-all duration-500" 
                style={{ width: `${remPct}%` }}
                title={t.planning.remainingTitle(`${Math.floor(currentAvailable / 60)}h ${currentAvailable % 60}m`)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {mits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.planning.mits}</h3>
            {mits.map(task => (
              <PlanningTaskItem key={task.id} task={task} onRemove={onRemoveTask} />
            ))}
          </div>
        )}
        
        {regularTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.planning.otherTasks}</h3>
            {regularTasks.map(task => (
              <PlanningTaskItem key={task.id} task={task} onRemove={onRemoveTask} />
            ))}
          </div>
        )}

        {plannedTasks.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
            <span className="text-sm">{t.planning.clickToAdd}</span>
          </div>
        )}
      </div>
    </div>
  );
}
