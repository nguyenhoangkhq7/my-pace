import { Button } from "@/components/ui/button";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { KanbanColumnData } from "@/components/kanban/types";

type KanbanColumnProps = {
  column: KanbanColumnData;
};

export function KanbanColumn({ column }: KanbanColumnProps) {
  return (
    <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-pace-border bg-pace-panel p-4">
      <header className="flex items-center justify-between text-xs font-semibold tracking-[0.2em] text-slate-300">
        <span>{column.title}</span>
        <span className="text-[11px] text-pace-muted">
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
          className="mt-auto justify-start rounded-md px-0 text-[13px]"
        >
          + Add a card
        </Button>
      </div>
    </section>
  );
}
