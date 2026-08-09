import { Task } from "../types";
import { Button } from "@/components/ui/button";
import { TaskDetails } from "./TaskDetails";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "./InlineTitleEditor";
import { useBoardStore } from "../store/board.store";
import { useTasks } from "../hooks/useTasks";

import { AlertCircle } from "lucide-react";
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

  const isHighRisk = slackTime !== undefined && slackTime >= 0 && slackTime < 720;
  const isInfeasible = slackTime !== undefined && slackTime < 0;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "p-3 bg-card border rounded-lg flex justify-between items-center group cursor-pointer transition-colors",
        isInfeasible 
          ? "border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
          : isHighRisk 
            ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
            : "border-border hover:border-primary/45"
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
                  <AlertCircle 
                    className={cn(
                      "w-4 h-4",
                      isInfeasible ? "text-red-500" : "text-yellow-500"
                    )} 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs">
                {isInfeasible
                  ? `Task này không thể hoàn thành đúng hạn! Thiếu ${Math.abs(slackTime!)} phút.` 
                  : `Bạn chỉ còn khoảng ${Math.round(slackTime! / 60)}h thời gian trống để làm task này.`}
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
