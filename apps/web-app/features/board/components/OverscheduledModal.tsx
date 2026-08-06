"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DailyPlanTask } from "@/features/board/types";
import { usePlanMyDay } from "@/features/board/hooks/usePlanMyDay";
import { toast } from "sonner";
import { AlertTriangle, Undo2 } from "lucide-react";

interface OverscheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
  planDate: string;
  overflowMinutes: number;
  tasks: DailyPlanTask[];
}

export function OverscheduledModal({
  isOpen,
  onClose,
  planDate,
  overflowMinutes,
  tasks,
}: OverscheduledModalProps) {
  const [removingTaskId, setRemovingTaskId] = useState<string | null>(null);
  const { planMyDay } = usePlanMyDay(planDate);

  const hours = Math.floor(overflowMinutes / 60);
  const mins = overflowMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const handleRemoveTask = async (taskId: string) => {
    setRemovingTaskId(taskId);
    try {
      const remainingTasks = tasks
        .filter((t) => t.task?.id !== taskId)
        .map((t, idx) => ({
          taskId: t.task.id,
          isMit: t.isMit ?? false,
          sortOrder: idx,
        }));

      const res = (await planMyDay({
        availableMinutes: 0,
        tasks: remainingTasks,
      })) as { overflowMinutes?: number; isOverscheduled?: boolean } | undefined;

      toast.success("Đã chuyển công việc về Backlog");

      if (!res?.isOverscheduled || !res.overflowMinutes || res.overflowMinutes <= 0) {
        toast.success("Kế hoạch ngày đã được cân bằng!");
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể gỡ công việc khỏi kế hoạch ngày.");
    } finally {
      setRemovingTaskId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] bg-slate-950 text-slate-50 border-amber-900/50">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <DialogTitle className="text-lg font-semibold text-slate-100">
              Kế hoạch bị quá tải ({timeStr})
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm">
            Tổng thời gian công việc vượt quá quỹ thời gian rảnh của ngày {planDate}. Vui lòng chọn công việc để chuyển về Backlog:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3 max-h-[300px] overflow-y-auto pr-1">
          {tasks.map((pt) => {
            const isRemoving = removingTaskId === pt.task?.id;
            return (
              <div
                key={pt.id || pt.task?.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-3">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {pt.task?.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {pt.task?.estimatedMinutes || 30} phút
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isRemoving}
                  onClick={() => pt.task?.id && handleRemoveTask(pt.task.id)}
                  className="shrink-0 border-amber-900/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 hover:text-amber-100"
                >
                  <Undo2 className="w-3.5 h-3.5 mr-1" />
                  {isRemoving ? "Đang chuyển..." : "Về Backlog"}
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
