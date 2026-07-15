"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateChecklistItemAction } from "@/features/board/actions/checklist.action";

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
  const queryClient = useQueryClient();
  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ taskId, checklistId, data }: { taskId: string, checklistId: string, data: { isCompleted: boolean } }) => updateChecklistItemAction(taskId, checklistId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleCheckedChange = (checked: boolean | "indeterminate") => {
    const isCompletedVal = checked === true;
    updateChecklistItemMutation.mutate({ taskId, checklistId: itemId, data: { isCompleted: isCompletedVal } });

    const allDone = (checklists || []).every((c) =>
      c.id === itemId ? isCompletedVal : c.isCompleted
    );

    if (allDone) {
      setTimeout(() => {
        onOpenChange(false);
        onAllCompleted();
      }, 400);
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
