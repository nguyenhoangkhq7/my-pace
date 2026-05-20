import { Button } from "@/components/ui/button";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import type { BoardColumn } from "@/features/todos/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";

type KanbanColumnProps = {
  column: BoardColumn;
};

export function KanbanColumn({ column }: KanbanColumnProps) {
  const sorted = [...column.tasks].sort((a, b) => a.position - b.position);

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-full max-h-full">
      {/* Column header — always visible */}
      <header className="flex shrink-0 items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-100">
          {column.name}
        </span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1.5 text-[11px] text-slate-400">
          {sorted.length}
        </span>
      </header>

      {/* Scrollable task list */}
      <div className="mt-4 flex-1 overflow-y-auto pr-0.5 min-h-0 scrollbar-thin">
        <div className="flex flex-col gap-3">
          {sorted.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      {/* "Add a card" — always pinned at bottom */}
      <div className="mt-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 rounded-md px-2 text-[13px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
          Add a card
        </Button>
      </div>
    </section>
  );
}
