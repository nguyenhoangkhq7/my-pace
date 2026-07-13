import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Task } from "@/features/board/types";
import { useTranslation } from "@/hooks/use-translation";

interface FlowPickTaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  backlogTasks: Task[];
  onPickTask: (task: Task) => void;
}

export function FlowPickTaskModal({ isOpen, onOpenChange, backlogTasks, onPickTask }: FlowPickTaskModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-slate-950 text-slate-50 border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold">{t.flow.addTaskToday}</DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {t.flow.selectBacklogTask}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {backlogTasks.map((task) => (
            <div 
              key={task.id} 
              onClick={() => {
                onOpenChange(false);
                onPickTask(task);
              }}
              className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                  {task.title}
                </div>
                {task.estimatedMinutes && (
                  <div className="text-[10px] text-slate-400 mt-0.5">{task.estimatedMinutes} {t.flow.minutesUnit}</div>
                )}
              </div>
              <button className="text-[10px] font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2.5 py-1 rounded-lg shrink-0 transition-colors">
                {t.flow.addBtn}
              </button>
            </div>
          ))}
        </div>

        <DialogFooter className="border-t border-slate-800/60 pt-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-900 w-full rounded-xl text-xs h-9 cursor-pointer"
          >
            {t.flow.cancelBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
