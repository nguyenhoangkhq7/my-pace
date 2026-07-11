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
}

export function TaskFormChecklist({ 
  taskId, 
  checklists,
  onAddChecklistLocal,
  onUpdateChecklistLocal,
  onDeleteChecklistLocal
}: TaskFormChecklistProps) {
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem } = useBoardStore();
  const { t } = useTranslation();

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

  return (
    <div className="grid gap-3 pt-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Tick01Icon} className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">{t.taskForm.checklistTitle}</h3>
      </div>
      
      {checklists.length > 0 && (
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
        {checklists.map((item, index) => (
          <TaskChecklistItemRow
            key={item.id || index}
            item={{
              title: item.title || "",
              isCompleted: !!item.isCompleted,
              id: item.id
            }}
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
