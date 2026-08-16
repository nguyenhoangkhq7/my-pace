import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Task } from "../types";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useTranslation } from "@/hooks/use-translation";
import { useCategories } from "../hooks/useCategories";

interface TaskDetailsProps {
  task: Task;
  isConfirmed?: boolean;
}

export function TaskDetails({ task, isConfirmed }: TaskDetailsProps) {
  const { t } = useTranslation();
  const { categories } = useCategories();
  const category = task.category || categories.find((c) => c.id === task.categoryId);

  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      {task.goalId && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {t.common.goal}
        </span>
      )}
      {category && (
        <span 
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
          style={{ 
            backgroundColor: `${category.color}15`, 
            color: category.color,
            borderColor: `${category.color}30`
          }}
        >
          {category.name}
        </span>
      )}

      {task.dueDate && (
        <span className="inline-flex items-center text-[10px] text-muted-foreground">
          <HugeiconsIcon icon={Calendar01Icon} size={10} className="mr-1" />
          {(() => {
            const d = new Date(task.dueDate);
            const timeStr = task.dueDate.includes("T") ? task.dueDate.split("T")[1].substring(0, 5) : "";
            const displayTime = timeStr && timeStr !== "00:00" && timeStr !== "23:59" ? ` ${timeStr}` : "";
            return `${d.toLocaleDateString()}${displayTime}`;
          })()}
        </span>
      )}
      
      {task.estimatedMinutes > 0 && (
        <div className="text-xs text-muted-foreground">{task.estimatedMinutes}m</div>
      )}
      
      <TaskCardChecklist task={task} disabled={isConfirmed} />
    </div>
  );
}
