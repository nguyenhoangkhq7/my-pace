"use client";

import { useEffect, useState, useCallback } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { getBoardById } from "@/features/todos/api";
import type { Board } from "@/features/todos/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Grid02Icon, Loading03Icon } from "@hugeicons/core-free-icons";

type TodosBoardViewProps = {
  boardId: number | null;
};

export function TodosBoardView({ boardId }: TodosBoardViewProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBoardById(id);
      setBoard(data);
    } catch {
      setError("Failed to load board. Please try again.");
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (boardId && boardId > 0) {
      void loadBoard(boardId);
    } else {
      setBoard(null);
    }
  }, [boardId, loadBoard]);

  // ── No board selected / no boards exist ─────────────────────────────────
  if (!boardId || boardId < 0) {
    return <NoBoardSelected />;
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          size={28}
          className="animate-spin text-pace-accent"
        />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  // ── Board loaded ─────────────────────────────────────────────────────────
  if (!board) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 py-6">
        <HugeiconsIcon icon={Grid02Icon} size={20} className="text-pace-accent" />
        <h1 className="text-xl font-semibold tracking-wide text-slate-100">
          {board.name}
        </h1>
        <span className="ml-auto text-xs text-slate-500">
          {board.boardColumns.length} column
          {board.boardColumns.length !== 1 ? "s" : ""}
        </span>
      </div>
      <KanbanBoard columns={board.boardColumns} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function NoBoardSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 pb-24">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-800/60">
        <HugeiconsIcon
          icon={Grid02Icon}
          size={36}
          className="text-slate-500"
        />
      </div>

      {/* Text */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-200">
          No board selected
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a board from the sidebar or create one to get started.
        </p>
      </div>

      {/* Create board CTA */}
      <button
        className="flex items-center gap-2 rounded-xl border border-pace-accent/40 bg-pace-accent/10 px-5 py-2.5 text-sm font-semibold text-pace-accent shadow-sm transition hover:bg-pace-accent/20 active:scale-95"
      >
        <span className="text-base leading-none">+</span>
        Create a board
      </button>
    </div>
  );
}
