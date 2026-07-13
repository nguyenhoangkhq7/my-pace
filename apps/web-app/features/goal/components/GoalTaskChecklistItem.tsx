import React, { useState, useRef } from "react";
import { TaskChecklistItem } from "@/features/board/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GoalTaskChecklistItemProps {
  taskId: string;
  item: TaskChecklistItem;
  updateChecklistItem: (taskId: string, checklistId: string, data: { title?: string; isCompleted?: boolean }) => Promise<void>;
  deleteChecklistItem: (taskId: string, checklistId: string) => Promise<void>;
}

export function GoalTaskChecklistItem({ taskId, item, updateChecklistItem, deleteChecklistItem }: GoalTaskChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [prevItemTitle, setPrevItemTitle] = useState(item.title);
  const [editVal, setEditVal] = useState(item.title);
  
  if (item.title !== prevItemTitle) {
    setPrevItemTitle(item.title);
    setEditVal(item.title);
  }

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const trimmed = editVal.trim();
    if (trimmed && trimmed !== item.title) {
      try {
        await updateChecklistItem(taskId, item.id, { title: trimmed });
      } catch {
        toast.error("Lỗi khi lưu");
        setEditVal(item.title);
      }
    } else {
      setEditVal(item.title);
    }
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChecklistItem(taskId, item.id);
    } catch {
      toast.error("Lỗi khi xoá");
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 group/cl">
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        size={13}
        className={cn("shrink-0 cursor-pointer transition-colors", item.isCompleted ? "text-emerald-500" : "text-muted-foreground/40 hover:text-emerald-500/60")}
        onClick={() => updateChecklistItem(taskId, item.id, { isCompleted: !item.isCompleted })}
      />
      {isEditing ? (
        <input
          ref={inputRef}
          autoFocus
          className="flex-1 text-xs bg-transparent border-b border-primary outline-none text-foreground min-w-0"
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditVal(item.title); setIsEditing(false); } }}
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-xs cursor-text truncate",
            item.isCompleted ? "text-muted-foreground/50 line-through" : "text-muted-foreground"
          )}
          onClick={() => { if (!item.isCompleted) { setIsEditing(true); setTimeout(() => inputRef.current?.focus(), 0); } }}
          title={item.isCompleted ? undefined : "Click để sửa"}
        >
          {item.title}
        </span>
      )}
      <button
        className="shrink-0 opacity-0 group-hover/cl:opacity-100 transition-opacity text-muted-foreground/40 hover:text-rose-500 transition-colors"
        onClick={handleDelete}
        title="Xoá"
      >
        <HugeiconsIcon icon={Delete01Icon} size={11} />
      </button>
    </div>
  );
}
