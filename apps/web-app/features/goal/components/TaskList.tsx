import React, { useState } from "react";
import { Task } from "@/features/board/types";
import { useBoardStore } from "@/features/board/store/board.store";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";
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
      toast.success(isVi ? "Đã tạo công việc!" : "Task created!");
      setIsCreating(false);
    } catch {
      toast.error(isVi ? "Lỗi khi tạo công việc" : "Error creating task");
    }
  };

  const handleAddToBacklog = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'Backlog' });
      toast.success(isVi ? "Đã chuyển công việc vào hàng chờ!" : "Task moved to Backlog!");
    } catch {
      toast.error(isVi ? "Lỗi khi chuyển công việc." : "Error moving task.");
    }
  };

  const handleMoveToIcebox = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'Icebox' });
      toast.success(isVi ? "Đã trả công việc về Icebox!" : "Task returned to Icebox!");
    } catch {
      toast.error(isVi ? "Lỗi khi chuyển công việc." : "Error moving task.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {isVi ? "Công việc" : "Tasks"}
        </h4>
        {isEditingProject && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-xs text-primary hover:text-primary/80 px-2" 
            onClick={() => setIsCreating(true)}
            disabled={gStatus === 'Freeze' || gStatus === 'Archived'}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={12} className="mr-1" />
            {isVi ? "Công việc" : "Task"}
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        {taskList.length === 0 && !isCreating ? (
          <p className="text-xs text-slate-600 italic">{t.goals.noTasks}</p>
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

