import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Task } from "../types";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface TaskBacklogCardProps {
  task: Task;
  onClick: () => void;
  isPlanned: boolean;
  slackTime?: number;
}

export function TaskBacklogCard({
  task,
  onClick,
  isPlanned,
  slackTime,
}: TaskBacklogCardProps) {
  const { t } = useTranslation();

  const formatDuration = (minutes: number) => {
    const m = Math.abs(minutes);
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0 && min > 0) return `${h} giờ ${min} phút`;
    if (h > 0) return `${h} giờ`;
    return `${min} phút`;
  };

  const getTooltipText = () => {
    if (slackTime === undefined) return "";
    
    const now = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isPastDue = dueDate && dueDate < now;

    if (slackTime < 0) {
      if (isPastDue) {
        const diffMins = Math.floor((now.getTime() - dueDate.getTime()) / 60000);
        return `Đã quá hạn ${formatDuration(diffMins)}!`;
      }
      return `Không đủ thời gian trống! Bạn còn thiếu ${formatDuration(Math.abs(slackTime))} để hoàn thành đúng hạn.`;
    }
    return `Lưu ý: Nếu bạn trì hoãn thêm ${formatDuration(slackTime)} nữa, task này chắc chắn sẽ trễ hạn.`;
  };

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
      <div className="flex gap-2 items-start justify-between">
        <div className="font-semibold text-foreground break-words text-sm mb-1 leading-snug">
          {task.title}
        </div>
        
        {(() => {
          const rem = Math.max(1, (task.estimatedMinutes || 60) - (task.actualMinutes || 0));
          const isWarning = slackTime !== undefined && (slackTime < 0 || slackTime < 480 || slackTime < rem * 0.5);
          if (!isWarning) return null;
          return (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                    <span 
                      className={cn(
                        "flex items-center justify-center w-[16px] h-[16px] rounded-full text-[10px] font-extrabold shadow-sm font-mono",
                        slackTime < 0 ? "bg-red-500 text-white" : "bg-yellow-500 text-yellow-950"
                      )}
                    >
                      !
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  {getTooltipText()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })()}
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
