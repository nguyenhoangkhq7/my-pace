import React, { useState } from "react";
import { Task } from "@/features/board/types";
import { useBoardStore } from "@/features/board/store/board.store";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

// Sub-components
import { GoalTaskItem } from "./GoalTaskItem";
import { TaskInlineCreateForm } from "./TaskInlineCreateForm";

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

  const handleInlineCreate = async (title: string) => {
    try {
      await useBoardStore.getState().createTask({
        title,
        goalId: gId,
        status: 'Icebox',
        estimatedMinutes: 0,
        isImportant: true,
        isUrgent: false
      } as Partial<Task>);
      toast.success("Đã tạo Task!");
      setIsCreating(false);
    } catch {
      toast.error("Lỗi khi tạo Task");
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
            <GoalTaskItem
              key={t.id}
              task={t}
              onTaskClick={onTaskClick}
              onAddToBacklog={(task, e) => { e.stopPropagation(); handleAddToBacklog(task); }}
              onMoveToIcebox={(task, e) => { e.stopPropagation(); handleMoveToIcebox(task); }}
            />
          ))
        )}
        {isCreating && (
          <TaskInlineCreateForm
            onSubmit={handleInlineCreate}
            onCancel={() => setIsCreating(false)}
          />
        )}
      </div>
    </div>
  );
}

