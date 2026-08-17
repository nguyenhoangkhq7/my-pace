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

  const formatShortTime = (minutes: number) => {
    const m = Math.max(0, minutes);
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0 && min > 0) return `${h}h${min}p`;
    if (h > 0) return `${h}h`;
    return `${min}p`;
  };

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
        task.actualMinutes && task.actualMinutes > 0 ? (
          <div className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
            <span className="font-bold">{formatShortTime(task.actualMinutes)}</span>
            <span className="opacity-60">/</span>
            <span>{formatShortTime(task.estimatedMinutes)}</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-mono">
            {formatShortTime(task.estimatedMinutes)}
          </div>
        )
      )}

      {task.isSplittable && task.maxDailyDuration && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
          {t.planning.maxPerDay(task.maxDailyDuration >= 60 ? `${Math.floor(task.maxDailyDuration / 60)}h` : `${task.maxDailyDuration}m`)}
        </span>
      )}
      
      <TaskCardChecklist task={task} disabled={isConfirmed} />
    </div>
  );
}
