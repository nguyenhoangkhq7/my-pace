import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { useBoardStore } from "../store/board.store";
import { Task } from "../types";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "./InlineTitleEditor";

interface TaskCardChecklistProps {
  task: Task;
  disabled?: boolean; // When in execution mode, we might want to disable toggling if we are not the current task? Actually no, checklist can always be toggled. Wait, read-only board?
}

export function TaskCardChecklist({ task, disabled }: TaskCardChecklistProps) {
  const { updateChecklistItem, reorderChecklists } = useBoardStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const checklists = task.checklists || [];
  const sortedChecklists = [...checklists].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  if (sortedChecklists.length === 0) return null;

  const completedCount = sortedChecklists.filter(c => c.isCompleted).length;
  const totalCount = sortedChecklists.length;
  const isAllDone = completedCount === totalCount;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    if (disabled) return;
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sortedChecklists];
    const [movedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, movedItem);
    
    const newIds = newOrder.map(c => c.id).filter((id): id is string => !!id);
    if (newIds.length === sortedChecklists.length) {
      try {
        await reorderChecklists(task.id, newIds);
      } catch (err) {
        console.error(err);
      }
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="w-full mt-2" onClick={e => e.stopPropagation()}>
      <div 
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors border",
          isAllDone 
            ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" 
            : "bg-muted text-foreground border-border hover:bg-accent"
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
        <div className="mt-2 space-y-2 p-2 bg-card/50 rounded-md border border-border">
          {sortedChecklists.map((item, index) => (
            <div 
              key={item.id} 
              className={cn(
                "flex items-center gap-2 w-full min-w-0 transition-colors",
                dragOverIndex === index && "border-t-2 border-primary pt-1",
                draggedIndex === index && "opacity-50"
              )}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <Checkbox 
                checked={item.isCompleted} 
                onCheckedChange={(checked) => !disabled && updateChecklistItem(task.id, item.id, { isCompleted: checked === true })}
                className="h-3.5 w-3.5 border-border shrink-0"
                disabled={disabled}
              />
              <InlineTitleEditor
                initialTitle={item.title}
                onSave={async (newTitle) => {
                  if (!disabled) {
                    await updateChecklistItem(task.id, item.id, { title: newTitle });
                  }
                }}
                className={cn(
                  "flex-1 text-[11px] leading-tight cursor-pointer hover:bg-muted/40 px-1 py-0.5 rounded break-words min-w-0",
                  item.isCompleted && "line-through text-muted-foreground",
                  !disabled && "cursor-grab active:cursor-grabbing"
                )}
                inputClassName="h-6 text-[11px] py-0.5 px-1 bg-background border-border text-foreground flex-1 min-w-0 cursor-text"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
