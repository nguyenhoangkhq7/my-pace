"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useChecklistMutations } from "@/features/board/hooks/useChecklistMutations";
import { toast } from "sonner";

interface ChecklistItemProps {
  taskId: string;
  itemId: string;
  title: string;
  isCompleted: boolean;
  checklists: Array<{ id: string; isCompleted: boolean }> | undefined;
  onOpenChange: (open: boolean) => void;
  onAllCompleted: () => void;
}

export function ChecklistItem({
  taskId,
  itemId,
  title,
  isCompleted,
  checklists,
  onOpenChange,
  onAllCompleted,
}: ChecklistItemProps) {
  const { updateChecklist } = useChecklistMutations(taskId);

  const handleCheckedChange = async (checked: boolean | "indeterminate") => {
    const isCompletedVal = checked === true;
    try {
      await updateChecklist({ checklistId: itemId, data: { isCompleted: isCompletedVal } });

      const allDone = (checklists || []).every((c) =>
        c.id === itemId ? isCompletedVal : c.isCompleted
      );

      if (allDone) {
        setTimeout(() => {
          onOpenChange(false);
          onAllCompleted();
        }, 400);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật danh sách kiểm tra.");
    }
  };

  return (
    <div className="flex items-start gap-3 bg-background p-3 rounded-xl border border-border hover:border-border/80 transition-colors">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleCheckedChange}
        className="mt-0.5 border-muted-foreground data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
      />
      <span
        className={cn(
          "text-sm pt-0.5 leading-tight flex-1 font-medium",
          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
        )}
      >
        {title}
      </span>
    </div>
  );
}
