import React, { useState } from "react";
import { Task } from "@/features/board/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, PlusSignIcon, InboxIcon, Delete01Icon, Archive02Icon, ArrowRight01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/features/board/store/board.store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import { useTranslation } from "@/hooks/use-translation";

import { GoalTaskTitleEditor } from "./GoalTaskTitleEditor";
import { GoalTaskChecklistItem } from "./GoalTaskChecklistItem";
import { GoalTaskInlineInput } from "./GoalTaskInlineInput";

interface GoalTaskItemProps {
  task: Task;
  defaultExpanded?: boolean;
  onAddToBacklog: (task: Task, e: React.MouseEvent) => void;
  onMoveToIcebox: (task: Task, e: React.MouseEvent) => void;
}

export function GoalTaskItem({ task, defaultExpanded = false, onAddToBacklog, onMoveToIcebox }: GoalTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const { updateTask, deleteTask, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useBoardStore();
  const { locale } = useTranslation();
  const isVi = locale === "vi";

  const hasChecklists = task.checklists && task.checklists.length > 0;
  const isDone = task.status === 'Done';
  const isBacklog = task.status === 'Backlog';
  const isIcebox = task.status === 'Icebox';

  const handleTitleSave = async (newTitle: string) => {
    try {
      await updateTask(task.id, { title: newTitle });
    } catch {
      toast.error(isVi ? "Lỗi khi lưu tên task" : "Error saving task name");
      throw new Error();
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(task.id);
      toast.success(isVi ? "Đã xoá task!" : "Task deleted!");
    } catch {
      toast.error(isVi ? "Lỗi khi xoá task" : "Error deleting task");
    }
    setIsConfirmDeleteOpen(false);
  };

  const handleAddChecklistItem = async (title: string) => {
    try {
      await addChecklistItem(task.id, title);
      if (!isExpanded) setIsExpanded(true);
    } catch {
      toast.error(isVi ? "Lỗi khi thêm checklist" : "Error adding checklist");
    }
  };

  const containerClass = cn(
    "flex flex-col rounded-md border transition-all duration-200",
    isDone
      ? "border-border/40 bg-muted/20 opacity-60"
      : isBacklog
      ? "border-primary/20 bg-primary/5"
      : "border-border bg-card hover:border-border/80"
  );

  return (
    <div className={containerClass}>
      <div className="p-2.5 flex items-center justify-between group">
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {hasChecklists ? (
            <button
              className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              <HugeiconsIcon icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon} size={14} />
            </button>
          ) : (
            <div className="w-[22px] shrink-0" />
          )}

          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={16}
            className={cn("shrink-0", isDone ? "text-emerald-500" : isBacklog ? "text-primary/60" : "text-muted-foreground/50")}
          />

          <GoalTaskTitleEditor
            initialTitle={task.title}
            isDone={isDone}
            onSave={handleTitleSave}
          />

          {isBacklog && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/20">
              Backlog
            </span>
          )}
          {isDone && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Done
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isIcebox && (
            <button
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded flex items-center gap-1 transition-colors"
              onClick={(e) => onAddToBacklog(task, e)}
              title="Đưa vào Backlog"
            >
              <HugeiconsIcon icon={InboxIcon} size={10} />
              <span>Backlog</span>
            </button>
          )}
          {isBacklog && (
            <button
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded flex items-center gap-1 transition-colors"
              onClick={(e) => onMoveToIcebox(task, e)}
              title="Trả về Icebox"
            >
              <HugeiconsIcon icon={Archive02Icon} size={10} />
              <span>Icebox</span>
            </button>
          )}
          {!isDone && (
            <button
              className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsConfirmDeleteOpen(true); }}
              title={isVi ? "Xoá task" : "Delete task"}
            >
              <HugeiconsIcon icon={Delete01Icon} size={12} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && hasChecklists && (
        <div className="pl-9 pr-2.5 pb-1 flex flex-col gap-0.5 border-t border-border/50 pt-1.5 bg-muted/10">
          {task.checklists!.map((cl) => (
            <GoalTaskChecklistItem
              key={cl.id}
              taskId={task.id}
              item={cl}
              updateChecklistItem={updateChecklistItem}
              deleteChecklistItem={deleteChecklistItem}
            />
          ))}
        </div>
      )}

      {!isDone && (
        <div className={cn("border-t border-border/40", isExpanded && hasChecklists && "border-t-0 mt-0.5")}>
          {isAddingChecklist ? (
            <div className="pl-9 pr-2.5 py-1.5">
              <GoalTaskInlineInput
                placeholder={isVi ? "Thêm checklist và nhấn Enter..." : "Add checklist and press Enter..."}
                onSubmit={handleAddChecklistItem}
                onCancel={() => setIsAddingChecklist(false)}
              />
            </div>
          ) : (
            <button
              className="w-full text-left pl-9 pr-2.5 py-1 text-[11px] text-muted-foreground/50 hover:text-primary hover:bg-primary/5 flex items-center gap-1.5 transition-colors rounded-b-md"
              onClick={(e) => { e.stopPropagation(); setIsAddingChecklist(true); if (!isExpanded) setIsExpanded(true); }}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={10} />
              Checklist
            </button>
          )}
        </div>
      )}
      
      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={handleDeleteTask}
        title={isVi ? "Xoá task này?" : "Delete this task?"}
        description={isVi ? "Hành động này không thể hoàn tác." : "This action cannot be undone."}
        confirmText={isVi ? "Đồng ý xoá" : "Delete"}
        cancelText={isVi ? "Huỷ" : "Cancel"}
      />
    </div>
  );
}
