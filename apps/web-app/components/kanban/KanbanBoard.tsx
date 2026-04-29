import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanColumnData } from "@/components/kanban/types";

type KanbanBoardProps = {
  columns: KanbanColumnData[];
};

export function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 gap-6 overflow-x-auto pb-6">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}

