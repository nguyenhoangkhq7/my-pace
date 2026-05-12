import { Button } from "@/components/ui/button";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { KanbanColumnData } from "@/features/todos/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";

type KanbanColumnProps = {
  column: KanbanColumnData;
};

export function KanbanColumn({ column }: KanbanColumnProps) {
  return (
    <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <header className="flex items-center justify-between text-[11px] font-semibold tracking-[0.2em] text-slate-100">
        <span>{column.title}</span>
        <span className="text-[11px] text-slate-400">
          {column.cards.length}
        </span>
      </header>
      <div className="mt-4 flex flex-1 flex-col gap-4">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="mt-auto justify-start gap-2 rounded-md px-2 text-[13px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
          Add a card
        </Button>
      </div>
    </section>
  );
}
