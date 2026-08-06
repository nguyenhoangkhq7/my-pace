import { Task } from "../types";
import { Button } from "@/components/ui/button";
import { TaskDetails } from "./TaskDetails";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "./InlineTitleEditor";
import { useBoardStore } from "../store/board.store";
import { useTasks } from "../hooks/useTasks";

interface PlanningTaskItemProps {
  task: Task;
  onRemove: (taskId: string) => void;
}

export function PlanningTaskItem({ task, onRemove }: PlanningTaskItemProps) {
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

  return (
    <div
      onClick={handleCardClick}
      className="p-3 bg-card border border-border rounded-lg flex justify-between items-center group cursor-pointer hover:border-primary/45 transition-colors"
    >
      <div className="flex-1">
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
