"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DailyPlanTask } from "@/features/board/types";

interface SwitchTaskConfirmDialogProps {
  isOpen: boolean;
  currentTaskTitle: string;
  pendingTask: DailyPlanTask | null;
  accumulatedFocusTime: number; // seconds
  isSaving?: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveAndSwitch: () => void;
}

export function SwitchTaskConfirmDialog({
  isOpen,
  currentTaskTitle,
  pendingTask,
  accumulatedFocusTime,
  isSaving,
  onCancel,
  onDiscard,
  onSaveAndSwitch,
}: SwitchTaskConfirmDialogProps) {
  const focusedMinutes = Math.floor(accumulatedFocusTime / 60);
  const hasProgress = accumulatedFocusTime >= 60;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[460px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Bạn đang trong phiên tập trung 🔥
          </DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed space-y-1 pt-1">
            <span className="block">
              Đồng hồ Pomodoro đang gắn với task{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{currentTaskTitle}&rdquo;
              </span>
              {hasProgress && (
                <span>
                  {" "}và bạn đã tập trung được{" "}
                  <span className="font-semibold text-indigo-400">
                    {focusedMinutes} phút
                  </span>
                </span>
              )}
              .
            </span>
            {pendingTask && (
              <span className="block mt-1">
                Bạn muốn chuyển sang{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{pendingTask.task.title}&rdquo;
                </span>
                ?
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onCancel}
          >
            Hủy, tiếp tục tập trung
          </Button>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
            onClick={onDiscard}
          >
            Bỏ qua &amp; Chuyển
          </Button>
          {hasProgress && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={onSaveAndSwitch}
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu & Chuyển"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
