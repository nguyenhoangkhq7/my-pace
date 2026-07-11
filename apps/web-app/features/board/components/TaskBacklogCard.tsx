import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Task } from "../types";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useBoardStore } from "../store/board.store";
import { InlineTitleEditor } from "./InlineTitleEditor";

interface TaskBacklogCardProps {
  task: Task;
  onClick: () => void;
  isPlanned: boolean;
}

export function TaskBacklogCard({
  task,
  onClick,
  isPlanned,
}: TaskBacklogCardProps) {
  const { updateTask } = useBoardStore();

  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
        isPlanned
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-border/80 hover:bg-muted text-foreground"
      }`}
    >
      <InlineTitleEditor
        initialTitle={task.title}
        onSave={async (newTitle) => {
          await updateTask(task.id, { title: newTitle });
        }}
        className="font-medium line-clamp-2 hover:bg-muted/60 px-1 -mx-1 rounded cursor-text block"
        inputClassName="h-7 text-sm bg-card border-border"
      />
      
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {task.goalId ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Goal
          </span>
        ) : task.category ? (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
            style={{ 
              backgroundColor: `${task.category.color}15`, 
              color: task.category.color,
              borderColor: `${task.category.color}30`
            }}
          >
            {task.category.name}
          </span>
        ) : null}

        {task.dueDate && (
          <span className="inline-flex items-center text-[10px] text-muted-foreground">
            <HugeiconsIcon icon={Calendar01Icon} size={10} className="mr-1" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        
        {task.estimatedMinutes > 0 && (
          <div className="text-xs text-muted-foreground">{task.estimatedMinutes}m</div>
        )}
      </div>
      
      <TaskCardChecklist task={task} />
    </div>
  );
}
