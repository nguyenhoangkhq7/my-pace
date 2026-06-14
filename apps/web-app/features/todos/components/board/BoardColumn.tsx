"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  PlusSignIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

import { BoardTask, TaskStatus } from "../../types/todo.type";
import { TaskCard } from "./TaskCard";
import { useCategoryFilterStore } from "../../stores/category-filter.store";
import { useTasks } from "../../hooks/useTasks";

type BoardColumnProps = {
  status: TaskStatus;
  title: string;
  tasks: BoardTask[];
  count: number;
};

export function BoardColumn({
                              status,
                              title,
                              tasks,
                              count,
                            }: BoardColumnProps) {
  const { createTask } = useTasks();

  const selectedCategoryId = useCategoryFilterStore(
      (s) => s.selectedCategoryId,
  );

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
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (!isAdding) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (
          target instanceof Node &&
          addTaskRef.current &&
          !addTaskRef.current.contains(target)
      ) {
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isAdding]);

  const handleSubmit = async () => {
    const trimmed = newTitle.trim();

    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);

    const created = await createTask({
      title: trimmed,
      status,
      categoryId: selectedCategoryId,
      energyRequired: null,
    });

    if (created) {
      setNewTitle("");
      inputRef.current?.focus();
    }

    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }

    if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
      <section
          className={cn(
              "flex w-72 shrink-0 flex-col self-start",
              "rounded-3xl",
              "border border-pace-border",
              "bg-slate-900/50",
              "shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
              "p-4",
          )}
      >
        {/* Header */}
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pace-text">
            {title}
          </span>

            <span
                className={cn(
                    "flex h-5 min-w-5 items-center justify-center",
                    "rounded-full px-1.5",
                    "bg-pace-card",
                    "text-[11px] text-pace-muted",
                )}
            >
            {count}
          </span>
          </div>

          <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                  "text-pace-muted",
                  "hover:bg-pace-card",
                  "hover:text-pace-text",
              )}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
          </Button>
        </header>

        {/* Task list */}
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Add task */}
        <div ref={addTaskRef} className="mt-3 shrink-0">
          {isAdding ? (
              <div
                  className={cn(
                      "flex flex-col gap-2 rounded-2xl",
                      "border border-pace-border-strong",
                      "bg-pace-sidebar",
                      "p-2.5",
                  )}
              >
                <input
                    ref={inputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Task title..."
                    disabled={isSubmitting}
                    className={cn(
                        "w-full rounded-xl",
                        "border border-pace-border",
                        "bg-pace-bg",
                        "px-3 py-2",
                        "text-sm text-pace-text",
                        "placeholder:text-pace-muted-soft",
                        "outline-none transition-all",
                        "focus:border-pace-accent",
                        "focus:ring-1 focus:ring-pace-accent/30",
                    )}
                />

                <div className="flex items-center gap-2">
                  <Button
                      onClick={handleSubmit}
                      disabled={!newTitle.trim() || isSubmitting}
                      size="sm"
                      className={cn(
                          "h-8 flex-1 rounded-xl",
                          "bg-pace-accent",
                          "text-xs font-semibold text-slate-950",
                          "hover:brightness-110",
                          "disabled:cursor-not-allowed disabled:opacity-40",
                      )}
                  >
                    {isSubmitting ? "Adding..." : "Add"}
                  </Button>

                  <Button
                      onClick={handleCancel}
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                          "h-8 w-8",
                          "text-pace-muted",
                          "hover:bg-pace-card",
                          "hover:text-pace-text",
                      )}
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
                      "w-full justify-start gap-2",
                      "text-[13px] text-pace-muted",
                      "hover:bg-pace-card",
                      "hover:text-pace-text",
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