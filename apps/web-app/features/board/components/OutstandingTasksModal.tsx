import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBoardStore } from "../store/board.store";
import { Task } from "../types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Undo02Icon } from "@hugeicons/core-free-icons";

interface OutstandingTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function OutstandingTasksModal({ isOpen, onClose, tasks }: OutstandingTasksModalProps) {
  const { updateTask, deleteTask } = useBoardStore();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleMoveToBacklog = async (task: Task) => {
    setActioningId(task.id);
    try {
      await updateTask(task.id, {
        title: task.title,
        status: "Backlog"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    setActioningId(taskId);
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-950 text-slate-50 border-slate-800 sm:max-w-[550px] max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl">⚠️</div>
            <DialogTitle className="text-xl">Công việc tồn đọng từ hôm qua</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed pt-1">
            Hệ thống phát hiện bạn có một số công việc đã chọn hôm qua nhưng chưa hoàn thành. Hãy chọn đưa về Backlog hoặc xóa bỏ chúng để giữ bảng làm việc sạch sẽ.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 scrollbar-thin">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-100 truncate" title={task.title}>
                  {task.title}
                </div>
                {task.category && (
                  <span 
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1"
                    style={{ 
                      backgroundColor: `${task.category.color}15`, 
                      color: task.category.color,
                      borderColor: `${task.category.color}30`
                    }}
                  >
                    {task.category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actioningId !== null}
                  className="h-8 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 cursor-pointer"
                  onClick={() => handleMoveToBacklog(task)}
                >
                  <HugeiconsIcon icon={Undo02Icon} className="w-3.5 h-3.5" />
                  <span>Về Backlog</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actioningId !== null}
                  className="h-8 text-xs bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 cursor-pointer"
                  onClick={() => handleDelete(task.id)}
                >
                  <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 border-t border-slate-800 pt-4 shrink-0">
          <Button variant="outline" className="border-slate-850 bg-slate-900 hover:bg-slate-800 text-slate-300 h-9" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
