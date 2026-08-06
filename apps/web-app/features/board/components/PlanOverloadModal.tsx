"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "../types";
import { AlertTriangle, X, Save } from "lucide-react";

interface PlanOverloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  overflowMinutes: number;
  plannedTasks: Task[];
  onRemoveTask: (taskId: string) => void;
  onSaveAnyway: () => void;
}

export function PlanOverloadModal({
  isOpen,
  onClose,
  overflowMinutes,
  plannedTasks,
  onRemoveTask,
  onSaveAnyway,
}: PlanOverloadModalProps) {
  const hours = Math.floor(overflowMinutes / 60);
  const mins = overflowMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-amber-500 mb-1">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Kế hoạch vượt quá thời gian trống
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1 pl-11">
            Tổng thời gian các công việc đang vượt quá quỹ thời gian rảnh{" "}
            <span className="text-amber-500 font-semibold">{timeStr}</span>. Bạn có thể bỏ bớt
            công việc bên dưới, hoặc vẫn lưu và tự xếp lịch thủ công sau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 max-h-[280px] overflow-y-auto pr-1">
          {plannedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-muted/40 border border-border hover:border-border/80 transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                <span className="text-xs text-muted-foreground">
                  {task.estimatedMinutes
                    ? `${Math.floor(task.estimatedMinutes / 60) > 0 ? Math.floor(task.estimatedMinutes / 60) + "h " : ""}${task.estimatedMinutes % 60}m`
                    : "Chưa có thời lượng"}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveTask(task.id)}
                className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Bỏ ra
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Tiếp tục chỉnh sửa
          </Button>
          <Button
            onClick={onSaveAnyway}
            className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Vẫn lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
