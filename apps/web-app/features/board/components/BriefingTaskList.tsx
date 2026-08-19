"use client";

import type { BriefingTaskItem } from "../types";
import { BriefingTaskItemCard } from "./BriefingTaskItemCard";

interface BriefingTaskListProps {
  tasks: BriefingTaskItem[];
  currentDate?: string;
  onRemove?: (taskId: string) => void;
  dimmed?: boolean;
}

export function BriefingTaskList({ tasks, currentDate, onRemove, dimmed }: BriefingTaskListProps) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => (
        <BriefingTaskItemCard
          key={task.id}
          task={task}
          currentDate={currentDate}
          onRemove={onRemove}
          dimmed={dimmed}
        />
      ))}
    </div>
  );
}
