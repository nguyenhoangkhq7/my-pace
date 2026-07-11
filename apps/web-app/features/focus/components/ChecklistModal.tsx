import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Task } from "@/features/board/types";
import { ChecklistItem } from "./ChecklistItem";

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
            <ChecklistItem
              key={item.id}
              taskId={activeTask.id}
              itemId={item.id}
              title={item.title}
              isCompleted={item.isCompleted}
              checklists={activeTask.checklists}
              onOpenChange={onOpenChange}
              onAllCompleted={onAllCompleted}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

