import React, { useState } from "react";
import { Task } from "@/features/board/types";
import { useBoardStore } from "@/features/board/store/board.store";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, PlusSignIcon, InboxIcon, Archive02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskListProps {
  taskList: Task[];
  gId: string;
  gStatus?: string;
  isEditingProject: boolean;
  onTaskClick: (task: Task) => void;
}

export function TaskList({ taskList, gId, gStatus, isEditingProject, onTaskClick }: TaskListProps) {
  const { updateTask } = useBoardStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleInlineCreate = async () => {
    if (!newTaskTitle.trim()) {
      setIsCreating(false);
      return;
    }
    try {
      await useBoardStore.getState().createTask({
        title: newTaskTitle,
        goalId: gId,
        status: 'Icebox',
        estimatedMinutes: 0,
        isImportant: true,
        isUrgent: false
      } as Partial<Task>);
      toast.success("Đã tạo Task!");
      setNewTaskTitle("");
      setIsCreating(false);
    } catch {
      toast.error("Lỗi khi tạo Task");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInlineCreate();
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTaskTitle("");
    }
  };

  const handleAddToBacklog = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'Backlog' });
      toast.success("Đã chuyển Task vào Backlog!");
    } catch {
      toast.error("Lỗi khi chuyển Task.");
    }
  };

  const handleMoveToIcebox = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'Icebox' });
      toast.success("Đã trả Task về Icebox!");
    } catch {
      toast.error("Lỗi khi chuyển Task.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks</h4>
        {isEditingProject && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-xs text-primary hover:text-primary/80 px-2" 
            onClick={() => setIsCreating(true)}
            disabled={gStatus === 'Freeze' || gStatus === 'Archived'}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={12} className="mr-1" />
            Task
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        {taskList.length === 0 && !isCreating ? (
          <p className="text-xs text-slate-600 italic">Chưa có Task nào.</p>
        ) : (
          taskList.map(t => (
            <div 
              key={t.id} 
              className="p-2.5 bg-slate-900/60 rounded-md border border-slate-800/80 flex items-center justify-between group transition-colors hover:border-slate-700 cursor-pointer"
              onClick={() => onTaskClick(t)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <HugeiconsIcon 
                  icon={CheckmarkCircle01Icon} 
                  size={16} 
                  className={cn("shrink-0", t.status === 'Done' ? "text-emerald-500" : "text-slate-600")} 
                />
                <span className={cn("text-sm truncate", t.status === 'Done' ? "text-slate-500 line-through" : "text-slate-300")}>
                  {t.title}
                </span>
                
                {t.status === 'Icebox' && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Icebox
                  </span>
                )}
                {t.status === 'Backlog' && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                    Backlog
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {t.status === 'Icebox' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 text-[10px] border-cyan-800/50 text-cyan-400 hover:bg-cyan-950 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); handleAddToBacklog(t); }}
                  >
                    <HugeiconsIcon icon={InboxIcon} size={10} className="mr-1" />
                    Đưa vào Backlog
                  </Button>
                )}
                {t.status === 'Backlog' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 text-[10px] border-slate-700 text-slate-400 hover:bg-slate-800 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); handleMoveToIcebox(t); }}
                  >
                    <HugeiconsIcon icon={Archive02Icon} size={10} className="mr-1" />
                    Trả về Icebox
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
        {isCreating && (
          <div className="p-2.5 bg-slate-900/60 rounded-md border border-primary/50 flex items-center">
            <input
              autoFocus
              className="bg-transparent border-none outline-none text-sm text-slate-200 w-full"
              placeholder="Nhập tên task và nhấn Enter..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInlineCreate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
