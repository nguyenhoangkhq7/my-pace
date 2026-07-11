"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DailyPlanTask } from "@/features/board/types";

interface ConfirmPlanDialogProps {
  isOpen: boolean;
  pendingTask: DailyPlanTask | null;
  onConfirm: () => void;
  onDecline: () => void;
}

export function ConfirmPlanDialog({
  isOpen,
  pendingTask,
  onConfirm,
  onDecline,
}: ConfirmPlanDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onDecline();
        }
      }}
    >
      <DialogContent className="sm:max-w-[440px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Task này cần daily plan đã xác nhận
          </DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            {pendingTask
              ? `Task "${pendingTask.task.title}" chỉ có thể vào focus mode sau khi daily plan được xác nhận. Nếu bỏ qua, bạn sẽ ở lại Flow mà không vào pomodoro.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onDecline}
          >
            Không, ở lại Flow
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={onConfirm}
          >
            Xác nhận rồi vào focus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
