import { TaskDetails } from "./TaskDetails";
import { Task } from "../types";
import { cn } from "@/lib/utils";

interface ExecutionTaskItemProps {
  task: Task;
  isMit: boolean;
  isConfirmed?: boolean;
}

export function ExecutionTaskItem({ task, isMit, isConfirmed }: ExecutionTaskItemProps) {
  const isDone = task.status === "Done";
  
  return (
    <div className={cn(
      "p-3 bg-card rounded-lg flex items-start space-x-3 border",
      isMit ? "border-primary/30" : "border-border"
    )}>
      <div className="flex-1">
        <div className={cn(
          "text-sm",
          isMit && "font-medium",
          isDone ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {task.title}
        </div>
        <TaskDetails task={task} isConfirmed={isConfirmed} />
      </div>
    </div>
  );
}
