"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Calendar01Icon,
  Alert02Icon,
  StarIcon,
  Target01Icon,
  Note01Icon,
  CheckListIcon,
  PencilEdit01Icon,
  Calendar03Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";
import type { QuickAddResult } from "../types";
import type { Category } from "@/features/board/types";
import type { Goal } from "@/features/goal/types";

interface QuickAddPreviewProps {
  result: QuickAddResult;
  categories: Category[];
  goals: Goal[];
  onConfirm: () => void;
  onEdit: () => void;
  onToggleType: () => void;
  isCreating: boolean;
}

export function QuickAddPreview({
  result,
  categories,
  goals,
  onConfirm,
  onEdit,
  onToggleType,
  isCreating,
}: QuickAddPreviewProps) {
  const { t } = useTranslation();
  const isEvent = result.type === "event";
  const category = categories.find((c) => c.id === result.categoryId);
  const goal = !isEvent ? goals.find((g) => g.id === result.goalId) : null;

  const formatDueDate = (iso: string) => {
    try {
      return format(new Date(iso), "EEEE, dd/MM · HH:mm", { locale: vi });
    } catch {
      return iso;
    }
  };

  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return t.quickAdd.noDueDate;
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        return format(new Date(parts[0], parts[1] - 1, parts[2]), "EEEE, dd/MM/yyyy", { locale: vi });
      }
      return format(new Date(dateStr), "EEEE, dd/MM/yyyy", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header: Type Switcher */}
      <div className="flex items-center justify-end">
        {/* Type Toggle Pills */}
        <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-xs font-medium border border-border/50">
          <button
            type="button"
            onClick={() => isEvent && onToggleType()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              !isEvent
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={Task01Icon} className="h-3.5 w-3.5" />
            {t.quickAdd.typeTask}
          </button>
          <button
            type="button"
            onClick={() => !isEvent && onToggleType()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              isEvent
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={Calendar03Icon} className="h-3.5 w-3.5" />
            {t.quickAdd.typeEvent}
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground">{result.title}</h3>

      {/* Metadata grid for TASK */}
      {result.type === "task" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <InfoBadge
              icon={Clock01Icon}
              label={t.quickAdd.duration}
              value={result.estimatedMinutes ? `${result.estimatedMinutes} phút` : t.quickAdd.noDuration}
              muted={!result.estimatedMinutes}
            />
            <InfoBadge
              icon={Calendar01Icon}
              label={t.quickAdd.dueDate}
              value={result.dueDate ? formatDueDate(result.dueDate) : t.quickAdd.noDueDate}
              muted={!result.dueDate}
            />
          </div>

          {(result.isUrgent || result.isImportant) && (
            <div className="flex gap-2">
              {result.isUrgent && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 font-medium">
                  <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3" />
                  {t.quickAdd.urgent}
                </span>
              )}
              {result.isImportant && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                  <HugeiconsIcon icon={StarIcon} className="h-3 w-3" />
                  {t.quickAdd.important}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Metadata grid for EVENT */}
      {result.type === "event" && (
        <div className="grid grid-cols-2 gap-2">
          <InfoBadge
            icon={Calendar01Icon}
            label={t.quickAdd.eventDate}
            value={formatEventDate(result.eventDate)}
            muted={!result.eventDate}
          />
          <InfoBadge
            icon={Clock01Icon}
            label={t.quickAdd.startTime}
            value={
              result.startTime
                ? `${result.startTime}${result.endTime ? ` → ${result.endTime}` : ""}`
                : t.quickAdd.allDay
            }
            muted={!result.startTime}
          />
        </div>
      )}

      {/* Category & Goal & Recurrence */}
      {(category || goal || (result.type === "event" && result.recurrenceType && result.recurrenceType !== "NONE")) && (
        <div className="flex gap-2 flex-wrap">
          {category && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted/60 text-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          )}
          {goal && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted/60 text-foreground">
              <HugeiconsIcon icon={Target01Icon} className="h-3 w-3 text-primary" />
              {goal.title}
            </span>
          )}
          {result.type === "event" && result.recurrenceType && result.recurrenceType !== "NONE" && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">
              <HugeiconsIcon icon={Calendar03Icon} className="h-3 w-3" />
              {result.recurrenceType === "DAILY" ? "Lặp hàng ngày" : "Lặp hàng tuần"}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {result.notes && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
          <HugeiconsIcon icon={Note01Icon} className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{result.notes}</span>
        </div>
      )}

      {/* Checklists (Task only) */}
      {result.type === "task" && result.checklists && result.checklists.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <HugeiconsIcon icon={CheckListIcon} className="h-3.5 w-3.5" />
            {t.quickAdd.checklist}
          </div>
          <ul className="space-y-0.5 ml-5">
            {result.checklists.map((item, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="h-3.5 w-3.5" />
          {t.quickAdd.edit}
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isCreating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs cursor-pointer"
        >
          {isCreating
            ? t.quickAdd.creating
            : isEvent
            ? `Tạo ${t.quickAdd.typeEvent}`
            : t.quickAdd.createTask}
        </Button>
      </div>
    </div>
  );
}

/* ─── Small helper ─── */
function InfoBadge({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md bg-muted/30">
      <HugeiconsIcon icon={icon} className={`h-3.5 w-3.5 shrink-0 ${muted ? "text-muted-foreground/50" : "text-primary/70"}`} />
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className={muted ? "text-muted-foreground/60 italic" : "text-foreground font-medium"}>{value}</span>
      </div>
    </div>
  );
}

