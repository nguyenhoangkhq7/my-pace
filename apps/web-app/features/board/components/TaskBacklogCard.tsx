import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Task } from "../types";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

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
  const { t } = useTranslation();

  return (
    <div 
      onClick={onClick}
      draggable={!isPlanned}
      onDragStart={(e) => {
        if (isPlanned) return;
        e.dataTransfer.setData("taskId", task.id);
        e.currentTarget.style.opacity = '0.4';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      className={cn(
        "p-3 rounded-lg border text-sm cursor-pointer transition-all",
        isPlanned
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-border/80 hover:bg-muted text-foreground"
      )}
    >
      <div className="font-semibold text-foreground break-words text-sm mb-1 leading-snug">
        {task.title}
      </div>
      
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {task.goalId ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {t.common.goal}
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
      </div>
      
      <TaskCardChecklist task={task} />
    </div>
  );
}
