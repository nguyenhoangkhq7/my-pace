import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useBoardStore } from "../store/board.store";
import type { TaskChecklistItem } from "../types";

interface TaskFormChecklistProps {
  taskId: string;
  checklists: TaskChecklistItem[];
}

export function TaskFormChecklist({ taskId, checklists }: TaskFormChecklistProps) {
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem } = useBoardStore();
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  const completedChecklistsCount = checklists.filter(c => c.isCompleted).length;
  const progressPercentage = checklists.length > 0 ? Math.round((completedChecklistsCount / checklists.length) * 100) : 0;

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    try {
      await addChecklistItem(taskId, newChecklistTitle.trim());
      setNewChecklistTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid gap-3 pt-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Tick01Icon} className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold">Việc cần làm</h3>
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
          <div key={item.id} className="flex items-start gap-3 group">
            <Checkbox 
              checked={item.isCompleted} 
              onCheckedChange={(checked) => updateChecklistItem(taskId, item.id, { isCompleted: checked === true })}
              className="mt-1 border-slate-700"
            />
            <span className={cn("text-sm pt-0.5", item.isCompleted && "line-through text-slate-500")}>
              {item.title}
            </span>
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"
              onClick={() => deleteChecklistItem(taskId, item.id)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddChecklist} className="flex gap-2 mt-2">
        <Input 
          value={newChecklistTitle}
          onChange={e => setNewChecklistTitle(e.target.value)}
          placeholder="Thêm một mục"
          className="bg-slate-900 border-slate-800 h-9"
        />
        <Button type="submit" size="sm" variant="secondary" className="h-9">
          Thêm
        </Button>
      </form>
    </div>
  );
}
