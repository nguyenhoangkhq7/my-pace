import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Task } from "../types";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useTranslation } from "@/hooks/use-translation";

interface TaskDetailsProps {
  task: Task;
  isConfirmed?: boolean;
}

export function TaskDetails({ task, isConfirmed }: TaskDetailsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      {task.goalId ? (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {t.common.goal}
        </span>
      ) : task.category ? (
        <span 
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
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
      
      <TaskCardChecklist task={task} disabled={isConfirmed} />
    </div>
  );
}
