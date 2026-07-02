import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { useBoardStore } from "../store/board.store";
import { Task } from "../types";
import { cn } from "@/lib/utils";

interface TaskCardChecklistProps {
  task: Task;
  disabled?: boolean; // When in execution mode, we might want to disable toggling if we are not the current task? Actually no, checklist can always be toggled. Wait, read-only board?
}

export function TaskCardChecklist({ task, disabled }: TaskCardChecklistProps) {
  const { updateChecklistItem } = useBoardStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const checklists = task.checklists || [];
  if (checklists.length === 0) return null;

  const completedCount = checklists.filter(c => c.isCompleted).length;
  const totalCount = checklists.length;
  const isAllDone = completedCount === totalCount;

  return (
    <div className="w-full mt-2" onClick={e => e.stopPropagation()}>
      <div 
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors border",
          isAllDone 
            ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" 
            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <HugeiconsIcon icon={Tick01Icon} size={14} />
        <span>{completedCount}/{totalCount}</span>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2 p-2 bg-slate-900/50 rounded-md border border-slate-800">
          {checklists.map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <Checkbox 
                checked={item.isCompleted} 
                onCheckedChange={(checked) => !disabled && updateChecklistItem(task.id, item.id, { isCompleted: checked === true })}
                className="mt-0.5 h-3.5 w-3.5 border-slate-700"
                disabled={disabled}
              />
              <span className={cn("flex-1 text-[11px] leading-tight pt-px", item.isCompleted && "line-through text-slate-500")}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
