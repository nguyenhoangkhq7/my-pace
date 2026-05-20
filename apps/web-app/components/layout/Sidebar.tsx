"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore } from "@/features/auth";
import {
  Grid02Icon,
  Calendar01Icon,
  MoreVertical,
  Delete01Icon,
  KanbanIcon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllBoards, deleteBoard } from "@/features/todos/api";
import type { BoardSummary } from "@/features/todos/types";

type SidebarProps = {
  selectedBoardId: number | null;
  onSelectBoard: (id: number) => void;
  onBoardsChange?: () => void;
};

export function Sidebar({
  selectedBoardId,
  onSelectBoard,
  onBoardsChange,
}: SidebarProps) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isBoardsOpen, setIsBoardsOpen] = useState(true);

  const isAuthInitialized = useAuthStore((s) => s.isInitialized);

  const loadBoards = useCallback(async () => {
    try {
      const data = await getAllBoards();
      setBoards(data);
      // Auto-select the first board on initial load / page refresh
      if (data.length > 0 && !selectedBoardId) {
        onSelectBoard(data[0].id);
      }
    } catch {
      setBoards([]);
    }
  }, [selectedBoardId, onSelectBoard]);

  useEffect(() => {
    if (!isAuthInitialized) return; // wait for auth/refresh to complete
    void loadBoards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthInitialized]); // re-run only when auth becomes ready

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      if (selectedBoardId === id) onSelectBoard(-1 as never);
      onBoardsChange?.();
    } catch {
      /* silent */
    }
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-pace-sidebar px-4 py-6">
      {/* Logo */}
      <div className="mb-8 px-2 text-xl font-bold tracking-wide text-slate-100">
        My<span className="text-pace-accent">PACE</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {/* Boards tree section */}
        <div>
          <button
            onClick={() => setIsBoardsOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/60 hover:text-slate-100 active:scale-95"
          >
            <HugeiconsIcon
              icon={Grid02Icon}
              size={16}
              className="shrink-0 text-pace-accent"
            />
            <span className="flex-1 text-left">Boards</span>
            {/* chevron */}
            <span
              className={cn(
                "text-slate-500 transition-transform duration-200",
                isBoardsOpen ? "rotate-90" : "rotate-0"
              )}
            >
              ▸
            </span>
          </button>

          {/* Board tree */}
          {isBoardsOpen && (
            <div className="mt-1 flex flex-col gap-0.5 pl-3">
              {boards.map((board) => (
                <BoardTreeItem
                  key={board.id}
                  board={board}
                  isSelected={selectedBoardId === board.id}
                  onSelect={() => onSelectBoard(board.id)}
                  onDelete={(e) => void handleDelete(e, board.id)}
                />
              ))}

              {boards.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-500">
                  No boards yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Calendar */}
        <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-pace-muted transition hover:bg-slate-800/60 hover:text-slate-100 active:scale-95">
          <HugeiconsIcon icon={Calendar01Icon} size={16} className="shrink-0" />
          <span>Calendar</span>
        </button>
      </nav>
    </aside>
  );
}

// ── Board tree item ───────────────────────────────────────────────────────────

type BoardTreeItemProps = {
  board: BoardSummary;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
};

function BoardTreeItem({
  board,
  isSelected,
  onSelect,
  onDelete,
}: BoardTreeItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition",
        isSelected
          ? "bg-slate-800/80 text-slate-100"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      )}
    >
      {/* Tree indent line */}
      <span className="ml-1 mr-1 h-4 w-px shrink-0 rounded-full bg-slate-700/60" />

      <HugeiconsIcon
        icon={KanbanIcon}
        size={13}
        className={cn(
          "shrink-0",
          isSelected ? "text-pace-accent" : "text-slate-600 group-hover:text-slate-400"
        )}
      />

      {/* Board name — clickable */}
      <button
        onClick={onSelect}
        className="min-w-0 flex-1 truncate text-left text-[13px] font-medium"
        title={board.name}
      >
        {board.name}
      </button>

      {/* 3-dot actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition group-hover:opacity-100 hover:bg-slate-700"
            aria-label="Board actions"
          >
            <HugeiconsIcon icon={MoreVertical} size={13} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          <DropdownMenuItem
            onClick={onDelete}
            className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
          >
            <HugeiconsIcon icon={Delete01Icon} size={14} />
            Delete board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
