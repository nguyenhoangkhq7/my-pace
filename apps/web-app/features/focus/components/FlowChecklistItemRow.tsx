"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { InlineTitleEditor } from "@/features/board/components/InlineTitleEditor";

interface FlowChecklistItemRowProps {
  id: string;
  title: string;
  isCompleted: boolean;
  onToggle: (checked: boolean) => void;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  onDelete: () => void;
  isPending?: boolean;
}

export function FlowChecklistItemRow({
  title,
  isCompleted,
  onToggle,
  onUpdateTitle,
  onDelete,
  isPending = false,
}: FlowChecklistItemRowProps) {
  return (
    <div className="flex items-center gap-2 bg-card/80 p-2.5 rounded-xl border border-border/80 hover:border-border transition-colors group">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => onToggle(checked === true)}
        disabled={isPending}
        className="border-muted-foreground cursor-pointer data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shrink-0"
      />
      <InlineTitleEditor
        initialTitle={title}
        onSave={onUpdateTitle}
        className={cn(
          "text-sm font-medium leading-tight flex-1 cursor-pointer hover:bg-muted/50 px-1.5 py-1 rounded transition-colors break-words min-w-0",
          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
        )}
        inputClassName="h-7 text-sm py-1 bg-background border-border text-foreground flex-1 min-w-0"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 cursor-pointer shrink-0 transition-opacity"
        onClick={onDelete}
      >
        <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
