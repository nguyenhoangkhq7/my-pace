import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import type { BoardColumn } from "@/features/todos/types";

type KanbanBoardProps = {
  columns: BoardColumn[];
};

export function KanbanBoard({ columns }: KanbanBoardProps) {
  const sorted = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Horizontal scroll for columns; align-items:stretch so every column grows to the same height */}
      <div className="flex min-w-0 flex-1 items-stretch gap-6 overflow-x-auto pb-6">
        {sorted.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}
