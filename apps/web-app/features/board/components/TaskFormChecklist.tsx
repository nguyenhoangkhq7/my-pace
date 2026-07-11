import { useState } from "react";
import { useBoardStore } from "../store/board.store";
import type { TaskChecklistItem } from "../types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { TaskChecklistItemRow } from "./TaskChecklistItemRow";
import { TaskChecklistCreateForm } from "./TaskChecklistCreateForm";
import { useTranslation } from "@/hooks/use-translation";

interface TaskFormChecklistProps {
  taskId?: string;
  checklists: Partial<TaskChecklistItem>[];
  onAddChecklistLocal?: (title: string) => void;
  onUpdateChecklistLocal?: (index: number, updates: { title?: string; isCompleted?: boolean }) => void;
  onDeleteChecklistLocal?: (index: number) => void;
  onReorderLocal?: (sourceIndex: number, destIndex: number) => void;
}

export function TaskFormChecklist({ 
  taskId, 
  checklists,
  onAddChecklistLocal,
  onUpdateChecklistLocal,
  onDeleteChecklistLocal,
  onReorderLocal
}: TaskFormChecklistProps) {
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem, reorderChecklists } = useBoardStore();
  const { t } = useTranslation();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const completedChecklistsCount = checklists.filter(c => c.isCompleted).length;
  const progressPercentage = checklists.length > 0 ? Math.round((completedChecklistsCount / checklists.length) * 100) : 0;

  const handleAddChecklist = async (title: string) => {
    if (taskId) {
      try {
        await addChecklistItem(taskId, title);
      } catch (err) {
        console.error(err);
      }
    } else if (onAddChecklistLocal) {
      onAddChecklistLocal(title);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === index) return;

    if (taskId) {
      // Create a new array of IDs with the moved item
      const newOrder = [...checklists];
      const [movedItem] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(index, 0, movedItem);
      
      const newIds = newOrder.map(c => c.id).filter((id): id is string => !!id);
      if (newIds.length === checklists.length) {
        try {
          await reorderChecklists(taskId, newIds);
        } catch (err) {
          console.error(err);
        }
      }
    } else if (onReorderLocal) {
      onReorderLocal(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Sort checklists if they have orderIndex, though backend should return them ordered.
  // In local mode they might not have orderIndex.
  const sortedChecklists = [...checklists].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  return (
    <div className="grid gap-3 pt-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Tick01Icon} className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">{t.taskForm.checklistTitle}</h3>
      </div>
      
      {sortedChecklists.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground w-8">{progressPercentage}%</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedChecklists.map((item, index) => (
          <TaskChecklistItemRow
            key={item.id || index}
            item={{
              title: item.title || "",
              isCompleted: !!item.isCompleted,
              id: item.id
            }}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            isDragOver={dragOverIndex === index}
            onUpdate={(updates) => {
              if (taskId && item.id) {
                updateChecklistItem(taskId, item.id, updates);
              } else if (onUpdateChecklistLocal) {
                onUpdateChecklistLocal(index, updates);
              }
            }}
            onDelete={() => {
              if (taskId && item.id) {
                deleteChecklistItem(taskId, item.id);
              } else if (onDeleteChecklistLocal) {
                onDeleteChecklistLocal(index);
              }
            }}
          />
        ))}
      </div>

      <TaskChecklistCreateForm onSubmit={handleAddChecklist} />
    </div>
  );
}
