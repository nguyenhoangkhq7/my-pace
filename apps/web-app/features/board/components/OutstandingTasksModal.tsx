import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "../hooks/useTasks";
import { DailyPlan } from "../types";
import { reviewPlanAction } from "../actions/plan.action";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface OutstandingTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  unreviewedPlan: DailyPlan;
}

export function OutstandingTasksModal({ isOpen, onClose, unreviewedPlan }: OutstandingTasksModalProps) {
  const { updateTask, deleteTask } = useTasks();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks in the past plan that are not Done
  const uncompletedPlanTasks = unreviewedPlan.tasks?.filter(pt => pt.task?.status !== "Done") || [];

  // Keep track of user choice for each task
  // Options: 'today' | 'backlog' | 'delete'
  const [choices, setChoices] = useState<Record<string, 'today' | 'backlog' | 'delete'>>(() => {
    const initial: Record<string, 'today' | 'backlog' | 'delete'> = {};
    uncompletedPlanTasks.forEach(pt => {
      if (pt.task?.id) {
        initial[pt.task.id] = 'today'; // Default choice is to roll over to today
      }
    });
    return initial;
  });

  const handleChoiceChange = (taskId: string, choice: 'today' | 'backlog' | 'delete') => {
    setChoices(prev => ({ ...prev, [taskId]: choice }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Process each task
      const promises = uncompletedPlanTasks.map(async (pt) => {
        const taskId = pt.task?.id;
        if (!taskId) return;
        const choice = choices[taskId];

        if (choice === 'today') {
          await updateTask({ id: taskId, data: { status: "Picked for Today" } });
        } else if (choice === 'backlog') {
          await updateTask({ id: taskId, data: { status: "Backlog" } });
        } else if (choice === 'delete') {
          await deleteTask(taskId);
        }
      });

      await Promise.all(promises);

      // Call API to mark past plan as reviewed
      await reviewPlanAction(unreviewedPlan.planDate);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });

      toast.success("Đã hoàn tất đánh giá kế hoạch ngày cũ.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi lưu đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (uncompletedPlanTasks.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="bg-slate-950 text-slate-50 border-slate-800 sm:max-w-[600px] max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl text-amber-400">☀️</div>
            <DialogTitle className="text-lg font-bold text-slate-100">Bắt đầu ngày mới!</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs leading-relaxed pt-1">
            Bạn có công việc chưa hoàn thành từ kế hoạch ngày cũ ({unreviewedPlan.planDate}). Hãy chọn phương án xử lý để tiếp tục:
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3.5 scrollbar-thin">
          {uncompletedPlanTasks.map((pt) => {
            const task = pt.task;
            if (!task) return null;
            const currentChoice = choices[task.id] || 'today';
            return (
              <div 
                key={task.id} 
                className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl flex flex-col gap-3 hover:border-slate-800 transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-200 truncate" title={task.title}>
                      {task.title}
                    </div>
                    {task.category && (
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1.5"
                        style={{ 
                          backgroundColor: `${task.category.color}10`, 
                          color: task.category.color,
                          borderColor: `${task.category.color}25`
                        }}
                      >
                        {task.category.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChoiceChange(task.id, 'today')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentChoice === 'today'
                        ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    Chuyển sang Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChoiceChange(task.id, 'backlog')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentChoice === 'backlog'
                        ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.05)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    Trả về Backlog
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChoiceChange(task.id, 'delete')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentChoice === 'delete'
                        ? 'bg-red-600/10 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.05)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-250'
                    }`}
                  >
                    Xóa công việc
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-5 border-t border-slate-850 pt-4 shrink-0 flex items-center justify-end gap-3">
          <Button 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/95 text-white font-semibold h-9 px-5 rounded-xl text-xs cursor-pointer shadow-lg shadow-primary/10 transition-all"
            onClick={handleSubmit}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận & Bắt đầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
