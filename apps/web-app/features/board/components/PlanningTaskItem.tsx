import { Task } from "../types";
import { Button } from "@/components/ui/button";
import { TaskDetails } from "./TaskDetails";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "./InlineTitleEditor";
import { useBoardStore } from "../store/board.store";
import { useTasks } from "../hooks/useTasks";


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlanningTaskItemProps {
  task: Task;
  slackTime?: number;
  onRemove: (taskId: string) => void;
}

export function PlanningTaskItem({ task, slackTime, onRemove }: PlanningTaskItemProps) {
  const { updateTask } = useTasks();
  const openTaskModal = useBoardStore((s) => s.openTaskModal);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    openTaskModal(task);
  };

  const rem = Math.max(1, (task.estimatedMinutes || 60) - (task.actualMinutes || 0));
  const isHighRisk = slackTime !== undefined && slackTime >= 0 && (slackTime < 480 || slackTime < rem * 0.5);
  const isInfeasible = slackTime !== undefined && slackTime < 0;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "p-3 bg-card border rounded-lg flex justify-between items-center group cursor-pointer transition-colors",
        "border-border hover:border-primary/45"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <InlineTitleEditor
          initialTitle={task.title}
          onSave={async (newTitle) => {
            await updateTask({ id: task.id, data: { title: newTitle } });
          }}
          className={cn(
            "text-sm text-foreground cursor-text hover:bg-muted/60 px-1 -mx-1 rounded inline-block break-words max-w-full",
            task.isImportant && "font-medium"
          )}
          inputClassName="h-7 text-sm bg-card border-border"
        />
        {(isHighRisk || isInfeasible) && (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="shrink-0 cursor-help">
                  <span 
                    className={cn(
                      "flex items-center justify-center w-[16px] h-[16px] rounded-full text-[10px] font-extrabold shadow-sm font-mono",
                      isInfeasible ? "bg-red-500 text-white" : "bg-yellow-500 text-yellow-950"
                    )}
                  >
                    !
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs">
                {(() => {
                  if (slackTime === undefined) return "";
                  const now = new Date();
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isPastDue = dueDate && dueDate < now;
                  
                  const formatDuration = (minutes: number) => {
                    const m = Math.abs(minutes);
                    const h = Math.floor(m / 60);
                    const min = m % 60;
                    if (h > 0 && min > 0) return `${h} giờ ${min} phút`;
                    if (h > 0) return `${h} giờ`;
                    return `${min} phút`;
                  };

                  if (slackTime < 0) {
                    if (isPastDue) {
                      const diffMins = Math.floor((now.getTime() - dueDate.getTime()) / 60000);
                      return `Đã quá hạn ${formatDuration(diffMins)}!`;
                    }
                    return `Task này không thể hoàn thành đúng hạn! Thiếu ${formatDuration(slackTime)}.`;
                  }
                  return `Bạn chỉ còn khoảng ${formatDuration(slackTime)} thời gian đệm trước khi task bị trễ.`;
                })()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        </div>
        <TaskDetails task={task} />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(task.id)}
        className="h-6 px-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 cursor-pointer"
      >
        Remove
      </Button>
    </div>
  );
}
