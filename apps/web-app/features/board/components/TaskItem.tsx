'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTaskStatusAction } from '../actions/task.action';
import { Button } from '@/components/ui/button';
import { appToast } from '@/components/feedback/app-toast';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (newStatus: string) => updateTaskStatusAction(task.id, newStatus),
    onSuccess: () => {
      // Invalidate the 'tasks' query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      appToast.success('Task updated');
    },
    onError: (error) => {
      appToast.error(error.message || 'Failed to update task');
    },
  });

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
        disabled={isPending}
        onClick={() => updateStatus(task.isImportant ? 'COMPLETED' : 'IN_PROGRESS')}
      >
        {isPending ? 'Updating...' : 'Toggle Status'}
      </Button>
    </div>
  );
}
