import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BoardCard } from "@/components/board/BoardCard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import type { TaskItem, TaskStatus } from "@/features/todos/types";
import { useFilterStore } from "@/stores/filter.store";

// ── Types ─────────────────────────────────────────────────────────────────────

type BoardColumnProps = {
  status: TaskStatus;
  title: string;
  tasks: TaskItem[];
  count: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BoardColumn({ status, title, tasks, count }: BoardColumnProps) {
  const setIsNewItemModalOpen = useFilterStore((s) => s.setIsNewItemModalOpen);

  return (
    <section
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl",
        "border border-slate-800 bg-slate-900/50 p-4",
        "h-full max-h-full",
      )}
    >
      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-100">
            {title}
          </span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1.5 text-[11px] text-slate-400">
            {count}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-400 hover:text-slate-100"
          aria-label="Column menu"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
        </Button>
      </header>

      {/* ── Scrollable card list ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <BoardCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      {/* ── Add task button ── */}
      <div className="mt-3 shrink-0">
        <Button
          onClick={() => setIsNewItemModalOpen(true, status)}
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 text-[13px]",
            "text-slate-400 hover:bg-slate-800 hover:text-slate-100 active:scale-95",
          )}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
          Add Task
        </Button>
      </div>
    </section>
  );
}
