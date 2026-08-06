"use client";

import { useState } from "react";
import type { Task } from "@/features/board/types";
import { cn } from "@/lib/utils";
import { ListTodo, ChevronDown } from "lucide-react";
import { TaskChecklistCreateForm } from "@/features/board/components/TaskChecklistCreateForm";
import { FlowChecklistItemRow } from "./FlowChecklistItemRow";
import { useChecklistMutations } from "@/features/board/hooks/useChecklistMutations";
import { toast } from "sonner";

interface FlowChecklistPanelProps {
  task: Task;
}

export function FlowChecklistPanel({ task }: FlowChecklistPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addChecklist, updateChecklist, deleteChecklist } = useChecklistMutations(task?.id);

  const checklists = task.checklists ?? [];
  const completedCount = checklists.filter((c) => c.isCompleted).length;
  const totalCount = checklists.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = async (title: string) => {
    try {
      await addChecklist(title);
    } catch {
      toast.error("Không thể thêm subtask.");
    }
  };

  return (
    <div className="w-full mt-3 shrink-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 mx-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 group",
          isOpen && "text-foreground bg-muted/40"
        )}
      >
        <ListTodo className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
        <span>
          {totalCount > 0 ? `Subtasks (${completedCount}/${totalCount})` : "Thêm subtask"}
        </span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[320px] opacity-100 mt-2" : "max-h-0 opacity-0")}>
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-3 space-y-3">
          {totalCount > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>Tiến độ subtask</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
            {checklists.map((item) => (
              <FlowChecklistItemRow
                key={item.id}
                id={item.id}
                title={item.title}
                isCompleted={item.isCompleted}
                onToggle={(checked) => updateChecklist({ checklistId: item.id, data: { isCompleted: checked } })}
                onUpdateTitle={async (newTitle) => { await updateChecklist({ checklistId: item.id, data: { title: newTitle } }); }}
                onDelete={() => deleteChecklist(item.id)}
              />
            ))}
          </div>

          <TaskChecklistCreateForm onSubmit={handleAdd} />
        </div>
      </div>
    </div>
  );
}
