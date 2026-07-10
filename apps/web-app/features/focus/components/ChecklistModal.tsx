import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/features/board/store/board.store";
import type { Task } from "@/features/board/types";

interface ChecklistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTask: Task;
  onAllCompleted: () => void;
}

export function ChecklistModal({ isOpen, onOpenChange, activeTask, onAllCompleted }: ChecklistModalProps) {
  if (!activeTask?.checklists || activeTask.checklists.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-wide">Hoàn thành Checklist</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Hãy hoàn thành tất cả các bước trước khi đóng công việc này.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {activeTask.checklists.map((item) => (
            <div key={item.id} className="flex items-start gap-3 bg-background p-3 rounded-xl border border-border hover:border-border/80 transition-colors">
              <Checkbox 
                checked={item.isCompleted} 
                onCheckedChange={(checked) => {
                   useBoardStore.getState().updateChecklistItem(activeTask.id, item.id, { isCompleted: checked === true });
                   
                   const allDone = (activeTask.checklists || []).every((c) => 
                     c.id === item.id ? checked === true : c.isCompleted
                   );
                   if (allDone) {
                     setTimeout(() => {
                       onOpenChange(false);
                       onAllCompleted();
                     }, 400);
                   }
                }}
                className="mt-0.5 border-muted-foreground data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <span className={cn("text-sm pt-0.5 leading-tight flex-1 font-medium", item.isCompleted ? "line-through text-muted-foreground" : "text-foreground")}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
