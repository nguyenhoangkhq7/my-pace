import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { TaskChecklistItem } from "../types";
import { InlineTitleEditor } from "./InlineTitleEditor";

interface TaskChecklistItemRowProps {
  item: TaskChecklistItem;
  onUpdate: (updates: { title?: string; isCompleted?: boolean }) => void;
  onDelete: () => void;
}

export function TaskChecklistItemRow({ item, onUpdate, onDelete }: TaskChecklistItemRowProps) {
  return (
    <div className="flex items-center gap-3 group w-full min-w-0">
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
          "text-sm text-foreground cursor-pointer hover:bg-muted/40 px-1 py-0.5 rounded flex-1 min-w-0 break-words",
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
