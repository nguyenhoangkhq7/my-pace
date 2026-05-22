"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon,
  Cancel01Icon,
  Tick01Icon,
  Calendar01Icon,
  Timer01Icon,
  RadioButtonIcon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import {BoardTask} from "../../types/todo.type";

// ── Helpers ───────────────────────────────────────────────────────────────────

type DueMeta = {
  label: string;
  level: "overdue" | "urgent" | "soon" | "comfortable";
};

function getDueMeta(dueDateStr: string): DueMeta {
  const diffMs = new Date(dueDateStr).getTime() - Date.now();

  if (diffMs <= 0) return { label: "Quá hạn", level: "overdue" };

  const totalMin = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  let label: string;
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${mins}m`;
  else label = `${mins}m`;

  const level: DueMeta["level"] =
    days === 0 && hours < 3
      ? "urgent"
      : days <= 1
        ? "soon"
        : "comfortable";

  return { label, level };
}

/** Left border accent and badge styling per urgency */
const dueLevelConfig: Record<
  DueMeta["level"],
  { border: string; badge: string; dot: string }
> = {
  overdue: {
    border: "border-l-rose-500",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    dot: "bg-rose-400",
  },
  urgent: {
    border: "border-l-amber-400",
    badge: "bg-amber-500/15 text-amber-300 border-amber-400/40",
    dot: "bg-amber-400",
  },
  soon: {
    border: "border-l-yellow-400",
    badge: "bg-yellow-500/10 text-yellow-300 border-yellow-400/30",
    dot: "bg-yellow-400",
  },
  comfortable: {
    border: "border-l-slate-600",
    badge: "bg-slate-700/50 text-slate-400 border-slate-600/40",
    dot: "bg-slate-500",
  },
};

function formatEstimate(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function categoryBadgeStyle(colorCode: string): React.CSSProperties {
  const hex = colorCode.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    color: colorCode,
    borderColor: `rgba(${r},${g},${b},0.35)`,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

type KanbanCardProps = {
  task: BoardTask;
};

export function KanbanCard({ task }: KanbanCardProps) {
  const [done, setDone] = useState(task.isDone);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = titleDraft.trim();
    setTitleDraft(trimmed || task.title);
    setEditing(false);
  };

  const cancelEdit = () => {
    setTitleDraft(task.title);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const dueMeta = task.dueDate ? getDueMeta(task.dueDate) : null;
  const dueConfig = dueMeta ? dueLevelConfig[dueMeta.level] : null;
  const hasFooter = Boolean(task.category || task.estimatedMinutes != null);

  return (
    <div
      className={cn(
        // Base card
        "group relative rounded-xl border-l-[3px] border border-slate-700/60",
        "bg-slate-800/80 shadow-sm backdrop-blur-sm",
        "transition-all duration-150",
        "hover:border-slate-600/80 hover:bg-slate-800 hover:shadow-md hover:-translate-y-px",
        // Left accent border by urgency (overrides base border-l color)
        dueConfig ? dueConfig.border : "border-l-slate-600",
        // Done state
        done && "opacity-50"
      )}
    >
      {/* ── Inner padding wrapper ── */}
      <div className="px-3 py-2.5">

        {/* ── Row 1: checkbox + title + edit icon ── */}
        <div className="flex items-start gap-2">
          {/* Done toggle */}
          <button
            onClick={() => setDone((v) => !v)}
            aria-label={done ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
            className={cn(
              "mt-0.75 shrink-0 transition-all duration-150 hover:scale-110 active:scale-95",
              done ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <HugeiconsIcon icon={done ? RadioButtonIcon : CircleIcon} size={15} />
          </button>

          {/* Title / edit input */}
          {editing ? (
            <div className="flex flex-1 items-center gap-1.5 min-w-0">
              <input
                ref={inputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitEdit}
                className={cn(
                  "flex-1 min-w-0 rounded-md border border-slate-500",
                  "bg-slate-700/80 px-2 py-0.5 text-sm text-slate-100",
                  "outline-none focus:border-pace-accent focus:ring-1 focus:ring-pace-accent/30",
                  "transition"
                )}
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
                aria-label="Lưu"
                className="shrink-0 text-emerald-400 hover:text-emerald-300 transition"
              >
                <HugeiconsIcon icon={Tick01Icon} size={13} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                aria-label="Huỷ"
                className="shrink-0 text-slate-500 hover:text-rose-400 transition"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
              </button>
            </div>
          ) : (
            <p
              className={cn(
                "flex-1 text-sm font-medium leading-5 text-slate-100 wrap-break-word",
                done && "text-slate-500 line-through"
              )}
            >
              {titleDraft}
            </p>
          )}

          {/* Edit button — on hover only */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              aria-label="Sửa tiêu đề"
              className={cn(
                "mt-0.75 shrink-0 text-slate-600 hover:text-slate-300",
                "opacity-0 group-hover:opacity-100 transition-all duration-150 active:scale-95"
              )}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
            </button>
          )}
        </div>

        {/* ── Row 2: Due date badge ── */}
        {dueMeta && dueConfig && (
          <div className="mt-2 pl-5.75">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5",
                "text-[10px] font-semibold uppercase tracking-wide leading-none",
                dueConfig.badge
              )}
            >
              {/* Pulsing dot for overdue/urgent */}
              {(dueMeta.level === "overdue" || dueMeta.level === "urgent") ? (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", dueConfig.dot)} />
                  <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", dueConfig.dot)} />
                </span>
              ) : (
                <HugeiconsIcon icon={Calendar01Icon} size={10} />
              )}
              {dueMeta.label}
            </span>
          </div>
        )}

        {/* ── Row 3: Footer — context + estimate ── */}
        {hasFooter && (
          <div
            className={cn(
              "mt-2 pl-5.75 flex items-center gap-2",
              dueMeta && "pt-1.5 border-t border-slate-700/50 mt-2"
            )}
          >
            {/* Category badge */}
            {task.category && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-1.5 py-0.5",
                  "text-[10px] font-semibold tracking-wide leading-none",
                  !task.category.colorCode &&
                  "border-slate-600/40 bg-slate-700/40 text-slate-400"
                )}
                style={
                  task.category.colorCode
                    ? categoryBadgeStyle(task.category.colorCode)
                    : undefined
                }
              >
                {task.category.name}
              </span>
            )}

            {/* Spacer */}
            {task.category && task.estimatedMinutes != null && (
              <span className="text-slate-700 text-[10px]">·</span>
            )}

            {/* Estimated time */}
            {task.estimatedMinutes != null && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <HugeiconsIcon icon={Timer01Icon} size={10} />
                {formatEstimate(task.estimatedMinutes)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}