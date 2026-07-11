import { Task } from "../types";
import { Button } from "@/components/ui/button";
import { TaskDetails } from "./TaskDetails";
import { cn } from "@/lib/utils";

interface PlanningTaskItemProps {
  task: Task;
  onRemove: (taskId: string) => void;
}

export function PlanningTaskItem({ task, onRemove }: PlanningTaskItemProps) {
  return (
    <div className="p-3 bg-card border border-border rounded-lg flex justify-between items-center group">
      <div className="flex-1">
        <div className={cn("text-sm text-foreground", task.isImportant && "font-medium")}>
          {task.title}
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
