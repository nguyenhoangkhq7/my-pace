import { Task } from "../types";
import { TaskDetails } from "./TaskDetails";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "./InlineTitleEditor";
import { useTasks } from "../hooks/useTasks";

interface ExecutionTaskItemProps {
  task: Task;
  isMit: boolean;
  isConfirmed?: boolean;
}

export function ExecutionTaskItem({ task, isMit, isConfirmed }: ExecutionTaskItemProps) {
  const { updateTask } = useTasks();
  const isDone = task.status === "Done";

  return (
    <div className={cn(
      "p-3 bg-card rounded-lg flex items-start space-x-3 border",
      isMit ? "border-primary/30" : "border-border"
    )}>
      <div className="flex-1">
        <InlineTitleEditor
          initialTitle={task.title}
          onSave={async (newTitle) => {
            await updateTask({ id: task.id, data: { title: newTitle } });
          }}
          className={cn(
            "text-sm cursor-text hover:bg-muted/60 px-1 -mx-1 rounded inline-block break-words max-w-full",
            isMit && "font-medium",
            isDone ? "text-muted-foreground line-through" : "text-foreground"
          )}
          inputClassName="h-7 text-sm bg-card border-border"
        />
        <TaskDetails task={task} isConfirmed={isConfirmed} />
      </div>
    </div>
  );
}
