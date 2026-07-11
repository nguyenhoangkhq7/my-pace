import { Task } from "@/features/board/types";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, InboxIcon, Archive02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface GoalTaskItemProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onAddToBacklog: (task: Task, e: React.MouseEvent) => void;
  onMoveToIcebox: (task: Task, e: React.MouseEvent) => void;
}

export function GoalTaskItem({ task, onTaskClick, onAddToBacklog, onMoveToIcebox }: GoalTaskItemProps) {
  return (
    <div 
      className="p-2.5 bg-slate-900/60 rounded-md border border-slate-800/80 flex items-center justify-between group transition-colors hover:border-slate-700 cursor-pointer"
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <HugeiconsIcon 
          icon={CheckmarkCircle01Icon} 
          size={16} 
          className={cn("shrink-0", task.status === 'Done' ? "text-emerald-500" : "text-slate-600")} 
        />
        <span className={cn("text-sm truncate", task.status === 'Done' ? "text-slate-500 line-through" : "text-slate-300")}>
          {task.title}
        </span>
        
        {task.status === 'Icebox' && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Icebox
          </span>
        )}
        {task.status === 'Backlog' && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
            Backlog
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {task.status === 'Icebox' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 text-[10px] border-cyan-800/50 text-cyan-400 hover:bg-cyan-950 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => onAddToBacklog(task, e)}
          >
            <HugeiconsIcon icon={InboxIcon} size={10} className="mr-1" />
            Đưa vào Backlog
          </Button>
        )}
        {task.status === 'Backlog' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 text-[10px] border-slate-700 text-slate-400 hover:bg-slate-800 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => onMoveToIcebox(task, e)}
          >
            <HugeiconsIcon icon={Archive02Icon} size={10} className="mr-1" />
            Trả về Icebox
          </Button>
        )}
      </div>
    </div>
  );
}
