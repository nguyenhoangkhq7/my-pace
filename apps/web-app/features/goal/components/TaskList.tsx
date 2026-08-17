import React, { useState } from "react";
import { Task } from "@/features/board/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { GoalTaskItem } from "./GoalTaskItem";
import { TaskInlineCreateForm } from "./TaskInlineCreateForm";

interface TaskListProps {
  taskList: Task[];
  gId: string;
  gStatus?: string;
}

export function TaskList({ taskList, gId, gStatus }: TaskListProps) {
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";
  const queryClient = useQueryClient();
  const createTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => fetchClient.post('tasks', data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Task> }) => fetchClient.put(`tasks/${id}`, data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const [isCreating, setIsCreating] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);

  const hasAnyChecklists = taskList.some(t => t.checklists && t.checklists.length > 0);

  const handleInlineCreate = async (title: string) => {
    try {
      await createTaskMutation.mutateAsync({
        title,
        goalId: gId,
        status: 'Icebox',
        isImportant: true,
        isUrgent: false
      } as Partial<Task>);
      toast.success(isVi ? "Đã tạo công việc!" : "Task created!");
    } catch {
      toast.error(isVi ? "Lỗi khi tạo công việc" : "Error creating task");
    }
  };

  const handleAddToBacklog = async (task: Task) => {
    try {
      await updateTaskMutation.mutateAsync({ id: task.id, data: { status: 'Backlog' } });
      toast.success(isVi ? "Đã chuyển vào Backlog!" : "Task moved to Backlog!");
    } catch {
      toast.error(isVi ? "Lỗi khi chuyển công việc." : "Error moving task.");
    }
  };

  const handleMoveToIcebox = async (task: Task) => {
    try {
      await updateTaskMutation.mutateAsync({ id: task.id, data: { status: 'Icebox' } });
      toast.success(isVi ? "Đã trả về Icebox!" : "Task returned to Icebox!");
    } catch {
      toast.error(isVi ? "Lỗi khi chuyển công việc." : "Error moving task.");
    }
  };

  const isDisabled = gStatus === 'Freeze' || gStatus === 'Archived';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isVi ? "Công việc" : "Tasks"}
          </h4>
          {/* Expand / collapse all */}
          {hasAnyChecklists && (
            <button
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              onClick={() => setAllExpanded(v => !v)}
              title={allExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}
            >
              <HugeiconsIcon icon={allExpanded ? ArrowDown01Icon : ArrowRight01Icon} size={11} />
              {allExpanded ? (isVi ? "Thu gọn" : "Collapse") : (isVi ? "Mở rộng" : "Expand")}
            </button>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs text-primary hover:text-primary/80 px-2"
          onClick={() => setIsCreating(true)}
          disabled={isDisabled}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={12} className="mr-1" />
          Task
        </Button>
      </div>
      <div className="space-y-1.5">
        {taskList.length === 0 && !isCreating ? (
          <p className="text-xs text-muted-foreground/60 italic">{t.goals.noTasks}</p>
        ) : (
          taskList.map(task => (
            <GoalTaskItem
              key={task.id}
              task={task}
              defaultExpanded={allExpanded}
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
