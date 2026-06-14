import { cn } from "@/lib/utils";
import type { BoardTask } from "../../types/todo.type";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { MatrixTaskItem } from "./MatrixTaskItem";

// ── Types ─────────────────────────────────────────────────────────────────────

type MatrixQuadrantProps = {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  tasks: BoardTask[];
  onSelectTask: (task: BoardTask) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MatrixQuadrant({
  title,
  icon,
  accentColor,
  tasks,
  onSelectTask,
}: MatrixQuadrantProps) {
  return (
    <div className="bg-pace-card rounded-2xl border border-pace-border p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2">
        {icon}
        <span className={cn("text-sm font-semibold", accentColor)}>
          {title}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add button */}
        <button
          aria-label={`Add task to ${title}`}
          className={cn(
            "shrink-0 rounded-md p-1 text-pace-muted",
            "transition hover:bg-pace-card-hover hover:text-pace-text active:scale-95"
          )}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
        </button>
      </div>

      {/* Task list */}
      <div className="mt-3 flex-1 overflow-y-auto scrollbar-thin max-h-65">
        {tasks.length > 0 ? (
          <div className="flex flex-col gap-1">
            {tasks.map((task) => (
              <MatrixTaskItem key={task.id} task={task} onSelectTask={() => onSelectTask(task)} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-pace-muted-soft text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}
