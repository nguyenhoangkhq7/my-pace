"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Task } from "@/features/board/types";
import { FlowChecklistItemRow } from "./FlowChecklistItemRow";
import { TaskChecklistCreateForm } from "@/features/board/components/TaskChecklistCreateForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChecklistItemAction, updateChecklistItemAction, deleteChecklistItemAction } from "@/features/board/actions/checklist.action";
import { toast } from "sonner";
import { ListTodo } from "lucide-react";

interface ChecklistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTask: Task;
  onAllCompleted: () => void;
}

export function ChecklistModal({ isOpen, onOpenChange, activeTask, onAllCompleted }: ChecklistModalProps) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
  };

  const addMutation = useMutation({
    mutationFn: (title: string) => addChecklistItemAction(activeTask?.id ?? "", { title }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ checklistId, data }: { checklistId: string; data: { title?: string; isCompleted?: boolean } }) =>
      updateChecklistItemAction(activeTask?.id ?? "", checklistId, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (checklistId: string) => deleteChecklistItemAction(activeTask?.id ?? "", checklistId),
    onSuccess: invalidate,
  });

  if (!activeTask) return null;

  const checklists = activeTask.checklists ?? [];
  const completedCount = checklists.filter((c) => c.isCompleted).length;
  const totalCount = checklists.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = async (title: string) => {
    try {
      await addMutation.mutateAsync(title);
    } catch {
      toast.error("Không thể thêm subtask.");
    }
  };

  const handleToggle = async (checklistId: string, isCompleted: boolean) => {
    try {
      await updateMutation.mutateAsync({ checklistId, data: { isCompleted } });
      const allDone = checklists.every((c) => (c.id === checklistId ? isCompleted : c.isCompleted));
      if (allDone && totalCount > 0) {
        setTimeout(() => {
          onOpenChange(false);
          onAllCompleted();
        }, 400);
      }
    } catch {
      toast.error("Không thể cập nhật subtask.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card text-foreground border-border z-[200]">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-wide flex items-center gap-2 text-foreground">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            Danh sách Subtask: {activeTask.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Thêm, chỉnh sửa hoặc đánh dấu hoàn thành các bước để làm việc hiệu quả.
          </DialogDescription>
        </DialogHeader>

        {totalCount > 0 && (
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Tiến độ hoàn thành ({completedCount}/{totalCount})</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted pr-1">
          {checklists.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-4 italic">
              Chưa có subtask nào. Nhập tiêu đề bên dưới để thêm subtask mới.
            </p>
          ) : (
            checklists.map((item) => (
              <FlowChecklistItemRow
                key={item.id}
                id={item.id}
                title={item.title}
                isCompleted={item.isCompleted}
                onToggle={(checked) => handleToggle(item.id, checked)}
                onUpdateTitle={async (newTitle) => {
                  await updateMutation.mutateAsync({ checklistId: item.id, data: { title: newTitle } });
                }}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))
          )}
        </div>

        <div className="pt-2 border-t border-border/60">
          <TaskChecklistCreateForm onSubmit={handleAdd} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
