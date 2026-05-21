"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BoardCard } from "@/components/board/BoardCard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  PlusSignIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import type { TaskItem, TaskStatus } from "@/features/todos/types";
import { useTodoStore } from "@/stores/todo.store";

// ── Types ─────────────────────────────────────────────────────────────────────

type BoardColumnProps = {
  status: TaskStatus;
  title: string;
  tasks: TaskItem[];
  count: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BoardColumn({ status, title, tasks, count }: BoardColumnProps) {
  const createTask = useTodoStore((s) => s.createTask);

  // ── Inline quick-add state ──
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTaskRef = useRef<HTMLDivElement>(null);

  const handleCancel = () => {
    setNewTitle("");
    setIsAdding(false);
  };

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  useEffect(() => {
    if (!isAdding) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && addTaskRef.current && !addTaskRef.current.contains(target)) {
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isAdding]);

  const handleSubmit = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTask({ title: trimmed, status });
      setNewTitle("");
      // Keep the input open for rapid entry
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to quick-add task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setNewTitle("");
      setIsAdding(false);
    }
  };

  return (
    <section
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl",
        "border border-slate-800 bg-slate-900/50 p-4",
        "self-start",
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
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} />
        ))}
      </div>

      {/* ── Inline quick-add ── */}
      <div ref={addTaskRef} className="mt-3 shrink-0">
        {isAdding ? (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 p-2.5">
            <input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title…"
              disabled={isSubmitting}
              className={cn(
                "w-full rounded-lg bg-slate-700/50 px-2.5 py-2",
                "text-sm text-slate-100 placeholder:text-slate-500",
                "border border-slate-600/50 outline-none",
                "focus:border-pace-accent focus:ring-1 focus:ring-pace-accent/30",
                "transition",
              )}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!newTitle.trim() || isSubmitting}
                size="sm"
                className={cn(
                  "h-7 flex-1 rounded-lg bg-pace-accent text-xs font-semibold text-slate-950",
                  "hover:brightness-110 active:scale-[0.97]",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                {isSubmitting ? "Adding…" : "Add"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-slate-400 hover:text-slate-100"
                aria-label="Cancel"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
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
        )}
      </div>
    </section>
  );
}
