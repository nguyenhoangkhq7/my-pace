import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Task } from "../types";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import { useCategories } from "../hooks/useCategories";

interface TaskBacklogCardProps {
  task: Task;
  onClick: () => void;
  isPlanned: boolean;
  slackTime?: number;
  isStarted?: boolean;
  onSwapClick?: (e: React.MouseEvent) => void;
}

export function TaskBacklogCard({
  task,
  onClick,
  isPlanned,
  slackTime,
  isStarted,
  onSwapClick,
}: TaskBacklogCardProps) {
  const { t } = useTranslation();
  const { categories } = useCategories();
  const category = task.category || categories.find((c) => c.id === task.categoryId);

  const formatDuration = (minutes: number) => {
    const m = Math.abs(minutes);
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0 && min > 0) return `${h} giờ ${min} phút`;
    if (h > 0) return `${h} giờ`;
    return `${min} phút`;
  };

  const formatShortTime = (minutes: number) => {
    const m = Math.max(0, minutes);
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0 && min > 0) return `${h}h${min}p`;
    if (h > 0) return `${h}h`;
    return `${min}p`;
  };

  const getTooltipText = () => {
    if (slackTime === undefined) return "";
    
    const now = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isPastDue = dueDate && dueDate < now;

    if (slackTime <= 0) {
      if (isPastDue) {
        const diffMins = Math.floor((now.getTime() - dueDate.getTime()) / 60000);
        return `Đã quá hạn ${formatDuration(diffMins)}!`;
      }
      if (slackTime === 0) {
        return `Lưu ý: Bạn phải bắt tay vào làm ngay bây giờ để kịp hạn chót!`;
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
        
        <div className="flex items-center gap-2">
          {isStarted && !isPlanned && (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={onSwapClick}
                    className="group relative flex items-center justify-center overflow-hidden rounded-full bg-orange-100 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-200 dark:hover:bg-orange-900/50 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <span className="relative z-10">{t.board.today.toLowerCase() === "today" ? "Swap" : "Chèn"}</span>
                    <div className="absolute inset-0 z-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t.board.today.toLowerCase() === "today" ? "Inject / Swap this task" : "Chen ngang công việc này"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

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
      </div>
      
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {task.goalId && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {t.common.goal}
          </span>
        )}
        {category && (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
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
      </div>
      
      <TaskCardChecklist task={task} />
    </div>
  );
}
