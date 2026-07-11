import { Task } from "../types";
import { Button } from "@/components/ui/button";
import { TaskDetails } from "./TaskDetails";
import { cn } from "@/lib/utils";
import { useBoardStore } from "../store/board.store";
import { InlineTitleEditor } from "./InlineTitleEditor";

interface PlanningTaskItemProps {
  task: Task;
  onRemove: (taskId: string) => void;
}

export function PlanningTaskItem({ task, onRemove }: PlanningTaskItemProps) {
  const { updateTask } = useBoardStore();

  return (
    <div className="p-3 bg-card border border-border rounded-lg flex justify-between items-center group">
      <div className="flex-1">
        <InlineTitleEditor
          initialTitle={task.title}
          onSave={async (newTitle) => {
            await updateTask(task.id, { title: newTitle });
          }}
          className={cn("text-sm text-foreground cursor-text hover:bg-muted/60 px-1 -mx-1 rounded block", task.isImportant && "font-medium")}
          inputClassName="h-7 text-sm bg-card border-border"
        />
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
