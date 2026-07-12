import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "./InlineTitleEditor";

interface TaskChecklistItemRowProps {
  item: { title: string; isCompleted: boolean; id?: string };
  onUpdate: (updates: { title?: string; isCompleted?: boolean }) => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function TaskChecklistItemRow({ 
  item, 
  onUpdate, 
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver
}: TaskChecklistItemRowProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 group w-full min-w-0 p-1 -ml-1 rounded transition-colors",
        isDragOver && "bg-muted border-t border-t-primary"
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="cursor-grab text-muted-foreground opacity-30 hover:opacity-100 active:cursor-grabbing shrink-0 flex items-center justify-center">
        <HugeiconsIcon icon={Menu01Icon} className="w-4 h-4" />
      </div>
      <Checkbox 
        checked={item.isCompleted} 
        onCheckedChange={(checked) => onUpdate({ isCompleted: checked === true })}
        className="border-border cursor-pointer shrink-0"
      />
      <InlineTitleEditor
        initialTitle={item.title}
        onSave={async (newTitle) => {
          onUpdate({ title: newTitle });
        }}
        className={cn(
          "text-sm text-foreground cursor-pointer hover:bg-muted/40 px-1 py-0.5 rounded min-w-0 break-words max-w-full inline-block",
          item.isCompleted && "line-through text-muted-foreground"
        )}
        inputClassName="h-7 text-sm py-1 bg-card border-border text-foreground flex-1 min-w-0"
      />
      <Button 
        type="button"
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 cursor-pointer shrink-0"
        onClick={onDelete}
      >
        <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
      </Button>
    </div>
  );
}
