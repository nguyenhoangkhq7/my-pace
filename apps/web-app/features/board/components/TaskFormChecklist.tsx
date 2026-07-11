import { useBoardStore } from "../store/board.store";
import type { TaskChecklistItem } from "../types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { TaskChecklistItemRow } from "./TaskChecklistItemRow";
import { TaskChecklistCreateForm } from "./TaskChecklistCreateForm";

interface TaskFormChecklistProps {
  taskId: string;
  checklists: TaskChecklistItem[];
}

export function TaskFormChecklist({ taskId, checklists }: TaskFormChecklistProps) {
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem } = useBoardStore();

  const completedChecklistsCount = checklists.filter(c => c.isCompleted).length;
  const progressPercentage = checklists.length > 0 ? Math.round((completedChecklistsCount / checklists.length) * 100) : 0;

  const handleAddChecklist = async (title: string) => {
    try {
      await addChecklistItem(taskId, title);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid gap-3 pt-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Tick01Icon} className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold text-slate-200">Việc cần làm</h3>
      </div>
      
      {checklists.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400 w-8">{progressPercentage}%</span>
          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {checklists.map(item => (
          <TaskChecklistItemRow
            key={item.id}
            item={item}
            onUpdate={(isCompleted) => updateChecklistItem(taskId, item.id, { isCompleted })}
            onDelete={() => deleteChecklistItem(taskId, item.id)}
          />
        ))}
      </div>

      <TaskChecklistCreateForm onSubmit={handleAddChecklist} />
    </div>
  );
}
