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
import { cn } from "@/lib/utils";
import { Flag, Loader2 } from "lucide-react";
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
  onReportError?: () => void;
  isCreating: boolean;
  isReporting?: boolean;
  hideTypeHeader?: boolean;
}

export function QuickAddPreview({
  result,
  categories,
  goals,
  onConfirm,
  onEdit,
  onToggleType,
  onReportError,
  isCreating,
  isReporting = false,
  hideTypeHeader = false,
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
    <div className="p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header: Type Switcher & Report Action */}
      {!hideTypeHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xs font-medium tracking-tight select-none">
              {t.quickAdd.aiParsed || "AI đã trích xuất"}
            </span>

            {onReportError && (
              <button
                type="button"
                onClick={() => onReportError()}
                disabled={isReporting}
                title={t.quickAdd.report || "Báo lỗi"}
                className={cn(
                  "group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight",
                  "text-muted-foreground/80 hover:text-rose-500 bg-muted/40 hover:bg-rose-500/10 border border-border/50 hover:border-rose-500/30",
                  "transition-all duration-150 cursor-pointer select-none active:scale-[0.98]",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isReporting && "opacity-80 cursor-wait bg-muted/60"
                )}
              >
                {isReporting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
                ) : (
                  <Flag className="h-3 w-3 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                )}
                <span>{isReporting ? t.quickAdd.reporting : t.quickAdd.report}</span>
              </button>
            )}
          </div>

          {/* Type Toggle Pills */}
          <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-xs font-medium border border-border/50">
            <button
              type="button"
              onClick={() => isEvent && onToggleType()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer text-xs",
                !isEvent
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={Task01Icon} className="h-3.5 w-3.5 text-primary" />
              {t.quickAdd.typeTask}
            </button>
            <button
              type="button"
              onClick={() => !isEvent && onToggleType()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer text-xs",
                isEvent
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={Calendar03Icon} className="h-3.5 w-3.5 text-amber-500" />
              {t.quickAdd.typeEvent}
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-base sm:text-lg font-medium text-foreground tracking-tight leading-snug">
        {result.title}
      </h3>

      {/* Metadata grid for TASK */}
      {result.type === "task" && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
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
            <div className="flex gap-2 flex-wrap">
              {result.isUrgent && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 font-medium border border-rose-500/20">
                  <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3" />
                  {t.quickAdd.urgent}
                </span>
              )}
              {result.isImportant && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 font-medium border border-amber-500/20">
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
        <div className="grid grid-cols-2 gap-2.5">
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
        <div className="flex gap-2 flex-wrap pt-1">
          {category && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted/60 text-foreground border border-border/40 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          )}
          {goal && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted/60 text-foreground border border-border/40 font-medium">
              <HugeiconsIcon icon={Target01Icon} className="h-3 w-3 text-primary" />
              {goal.title}
            </span>
          )}
          {result.type === "event" && result.recurrenceType && result.recurrenceType !== "NONE" && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 font-medium">
              <HugeiconsIcon icon={Calendar03Icon} className="h-3 w-3" />
              {result.recurrenceType === "DAILY"
                ? t.quickAdd.recurrenceDaily
                : result.recurrenceDaysOfWeek && result.recurrenceDaysOfWeek.length > 0
                ? `${t.quickAdd.recurrenceWeekly} (${formatPreviewDays(result.recurrenceDaysOfWeek)})`
                : t.quickAdd.recurrenceWeekly}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {result.notes && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/30">
          <HugeiconsIcon icon={Note01Icon} className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="leading-relaxed">{result.notes}</span>
        </div>
      )}

      {/* Checklists (Task only) */}
      {result.type === "task" && result.checklists && result.checklists.length > 0 && (
        <div className="space-y-1.5 bg-muted/20 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <HugeiconsIcon icon={CheckListIcon} className="h-3.5 w-3.5 text-primary" />
            {t.quickAdd.checklist} ({result.checklists.length})
          </div>
          <ul className="space-y-1 ml-4">
            {result.checklists.map((item, i) => (
              <li key={i} className="text-xs text-foreground/85 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="h-3.5 w-3.5" />
          {t.quickAdd.edit}
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isCreating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm cursor-pointer gap-1.5"
        >
          <span>
            {isCreating
              ? t.quickAdd.creating
              : isEvent
              ? t.quickAdd.createEvent
              : t.quickAdd.createTask}
          </span>
          <kbd className="px-1 py-0.2 rounded bg-primary-foreground/20 text-[9px] font-mono leading-none">
            ↵
          </kbd>
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
    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
      <HugeiconsIcon icon={icon} className={`h-3.5 w-3.5 shrink-0 ${muted ? "text-muted-foreground/40" : "text-primary"}`} />
      <div className="min-w-0">
        <span className="text-muted-foreground/80">{label}: </span>
        <span className={muted ? "text-muted-foreground/60 italic" : "text-foreground font-medium"}>{value}</span>
      </div>
    </div>
  );
}

function formatPreviewDays(days?: number[] | null): string {
  if (!days || days.length === 0) return "";
  const dayNames: Record<number, string> = {
    1: "T2",
    2: "T3",
    3: "T4",
    4: "T5",
    5: "T6",
    6: "T7",
    7: "CN",
  };
  return days.map((d) => dayNames[d] || `T${d}`).join(", ");
}

