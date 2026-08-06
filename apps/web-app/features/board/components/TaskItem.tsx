'use client';

import { Button } from '@/components/ui/button';
import { appToast } from '@/components/feedback/app-toast';
import { Task } from '../types';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { updateStatus, isUpdatingStatus } = useUpdateTaskStatus(task.id);

  const handleToggle = () => {
    updateStatus(task.isImportant ? 'COMPLETED' : 'IN_PROGRESS', {
      onSuccess: () => appToast.success('Task updated'),
      onError: (error) => appToast.error(error.message || 'Failed to update task'),
    });
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
      <div className="flex flex-col">
        <span className="font-medium text-sm text-foreground">{task.title}</span>
        {task.notes && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>
        )}
      </div>

      <Button
        variant={task.isImportant ? "default" : "outline"}
        size="sm"
        disabled={isUpdatingStatus}
        onClick={handleToggle}
      >
        {isUpdatingStatus ? 'Updating...' : 'Toggle Status'}
      </Button>
    </div>
  );
}
