import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { TaskChecklistItem } from "../types";

interface TaskChecklistItemRowProps {
  item: TaskChecklistItem;
  onUpdate: (isCompleted: boolean) => void;
  onDelete: () => void;
}

export function TaskChecklistItemRow({ item, onUpdate, onDelete }: TaskChecklistItemRowProps) {
  return (
    <div className="flex items-start gap-3 group">
      <Checkbox 
        checked={item.isCompleted} 
        onCheckedChange={(checked) => onUpdate(checked === true)}
        className="mt-1 border-slate-700 cursor-pointer"
      />
      <span className={cn("text-sm pt-0.5 text-slate-300", item.isCompleted && "line-through text-slate-500")}>
        {item.title}
      </span>
      <Button 
        type="button"
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 cursor-pointer"
        onClick={onDelete}
      >
        <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
      </Button>
    </div>
  );
}
