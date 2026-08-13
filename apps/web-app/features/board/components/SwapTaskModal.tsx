import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

interface SwapTaskModalProps {
  isOpen: boolean;
  urgentTask: Task | null;
  plannedTasks: Task[];
  availableMinutes: number;
  onOpenChange: (open: boolean) => void;
  onConfirmSwap: (tasksToDrop: string[]) => void;
}

export function SwapTaskModal({
  isOpen,
  urgentTask,
  plannedTasks,
  availableMinutes,
  onOpenChange,
  onConfirmSwap
}: SwapTaskModalProps) {
  const { t } = useTranslation();
  const [selectedToDrop, setSelectedToDrop] = useState<string[]>([]);
  const isEn = t.board.today.toLowerCase() === "today";

  // Calculate times
  const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const remainingFreeTime = Math.max(0, availableMinutes - usedTime);
  const urgentTime = urgentTask?.estimatedMinutes || 0;

  // Time freed up by selected tasks
  const freedTime = useMemo(() => {
    return plannedTasks
      .filter(t => selectedToDrop.includes(t.id))
      .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  }, [plannedTasks, selectedToDrop]);

  const canSwap = freedTime >= urgentTime;

  const handleToggleDrop = (taskId: string) => {
    setSelectedToDrop(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleConfirm = () => {
    if (canSwap) {
      onConfirmSwap(selectedToDrop);
      setSelectedToDrop([]);
      onOpenChange(false);
    }
  };

  if (!urgentTask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setSelectedToDrop([]);
    }}>
      <DialogContent className="sm:max-w-[450px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-amber-500 flex items-center gap-2">
            ⚠️ {isEn ? "Swap Task" : "Chen ngang công việc"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-sm leading-relaxed">
            {isEn 
              ? `To inject "${urgentTask.title}" (${urgentTime}m), you must free up some time. Select tasks to drop from your plan.`
              : `Để chen ngang "${urgentTask.title}" (${urgentTime} phút), bạn phải hi sinh một số công việc đã lên lịch.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <div className="flex justify-between text-xs font-semibold mb-3 px-1 text-muted-foreground">
            <span>{isEn ? "Required Time:" : "Thời gian chen ngang:"} {urgentTime} phút</span>
            <span className={canSwap ? "text-green-500" : "text-amber-500"}>
              {isEn ? "Freed Time:" : "Thời gian đánh đổi:"} {freedTime} phút
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {plannedTasks.map(task => {
              const isSelected = selectedToDrop.includes(task.id);
              const isDone = task.status === "Done";
              
              if (isDone) return null; // Can't swap done tasks

              return (
                <div 
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isSelected 
                      ? "border-amber-500/50 bg-amber-500/10" 
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggleDrop(task.id)}
                >
                  <Checkbox 
                    checked={isSelected} 
                    className="mt-0.5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium leading-none ${isSelected ? "text-amber-500" : ""}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.estimatedMinutes || 0} phút
                    </p>
                  </div>
                </div>
              );
            })}
            
            {plannedTasks.every(t => t.status === "Done") && (
              <p className="text-sm text-center text-muted-foreground py-4">
                {isEn ? "All tasks are done, nothing to swap." : "Tất cả công việc đã hoàn thành, không có gì để hoán đổi."}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            {isEn ? "Cancel" : "Hủy bỏ"}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canSwap}
            className={`${canSwap ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            {isEn ? "Swap Tasks" : "Đổi công việc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
