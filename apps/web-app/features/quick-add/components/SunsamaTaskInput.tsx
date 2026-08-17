"use client";

import { useRef, useEffect, useState } from "react";
import { useSunsamaTaskInput, UseSunsamaTaskInputOptions } from "../hooks/useSunsamaTaskInput";
import { QuickAddDateButton } from "./QuickAddDateButton";
import { QuickAddDurationButton } from "./QuickAddDurationButton";
import { QuickAddCategoryButton } from "./QuickAddCategoryButton";
import { QuickAddGoalButton } from "./QuickAddGoalButton";
import { QuickAddPriorityButton } from "./QuickAddPriorityButton";
import { QuickAddChecklistButton } from "./QuickAddChecklistButton";
import { QuickAddSplittableButton } from "./QuickAddSplittableButton";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import { useGoals } from "@/features/board/hooks/useGoals";
import { Loader2, FileText, X, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface SunsamaTaskInputProps extends UseSunsamaTaskInputOptions {
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  aiParsed?: boolean;
}

export function SunsamaTaskInput({
  onSuccess,
  onCancel,
  autoFocus = true,
  placeholder,
  className,
  aiParsed = false,
  ...options
}: SunsamaTaskInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const {
    isEditMode,
    title,
    setTitle,
    notes,
    setNotes,
    showNotes,
    setShowNotes,
    dueDate,
    setDueDate,
    dueTime,
    setDueTime,
    estimatedMinutes,
    setEstimatedMinutes,
    categoryId,
    setCategoryId,
    goalId,
    setGoalId,
    isUrgent,
    isImportant,
    setPriority,
    isSplittable,
    setIsSplittable,
    minChunkMinutes,
    setMinChunkMinutes,
    maxDailyDuration,
    setMaxDailyDuration,
    checklists,
    addChecklistItem,
    removeChecklistItem,
    isLoading,
    isDeleting,
    handleSubmit,
    handleDelete,
  } = useSunsamaTaskInput({
    ...options,
    onSuccess,
  });

  const { goals } = useGoals();
  const activeGoal = goals.find((g) => g.id === goalId);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
    }
  };

  const inputPlaceholder = placeholder || t.sunsamaForm.titlePlaceholder;

  return (
    <>
      <div className={cn("p-3.5 space-y-3 bg-card rounded-xl", className)}>
        {/* Missing duration prompt banner if requireDuration */}
        {options.requireDuration && (
          <p className="text-xs text-amber-500 font-medium px-1">
            💡 {t.sunsamaForm.requireDurationPrompt}
          </p>
        )}

        {/* Title Input */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={isLoading || isDeleting || (options.requireDuration && !!options.initialTitle)}
            maxLength={255}
            className="w-full bg-transparent border-none outline-none text-base font-medium text-foreground placeholder:text-muted-foreground/60 disabled:opacity-75"
            autoComplete="off"
            spellCheck={false}
          />
          {title.length >= 200 && (
            <span
              className={cn(
                "text-[10px] font-mono shrink-0 px-1 py-0.5 rounded",
                title.length >= 255
                  ? "text-rose-500 bg-rose-500/10 font-bold"
                  : "text-amber-500 bg-amber-500/10"
              )}
            >
              {title.length}/255
            </span>
          )}
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
        </div>

        {/* Optional Expandable Notes */}
        {showNotes && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">{t.sunsamaForm.notesLabel}</span>
              <div className="flex items-center gap-2">
                {notes.length >= 4500 && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1 rounded",
                      notes.length >= 5000 ? "text-rose-500 font-bold" : "text-amber-500"
                    )}
                  >
                    {notes.length}/5000
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotes(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.sunsamaForm.notesPlaceholder}
              rows={2}
              maxLength={5000}
              className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 resize-y"
            />
          </div>
        )}

        {/* Sunsama Toolbar Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
          {/* Left: Quick attribute selector buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <QuickAddDateButton
              dueDate={dueDate}
              onChange={setDueDate}
              dueTime={dueTime}
              onTimeChange={setDueTime}
            />
            <QuickAddDurationButton
              estimatedMinutes={estimatedMinutes}
              onChange={setEstimatedMinutes}
            />
            <QuickAddCategoryButton
              categoryId={categoryId}
              onChange={setCategoryId}
              disabled={!!goalId}
              inheritedGoalTitle={activeGoal?.title}
            />
            <QuickAddGoalButton
              goalId={goalId}
              onChange={setGoalId}
            />
            <QuickAddPriorityButton
              isUrgent={isUrgent}
              isImportant={isImportant}
              onChange={setPriority}
            />
            <QuickAddChecklistButton
              checklists={checklists}
              onAdd={addChecklistItem}
              onRemove={removeChecklistItem}
            />
            <QuickAddSplittableButton
              isSplittable={isSplittable}
              onSplittableChange={setIsSplittable}
              minChunkMinutes={minChunkMinutes}
              onMinChunkChange={setMinChunkMinutes}
              maxDailyDuration={maxDailyDuration}
              onMaxDailyChange={setMaxDailyDuration}
              estimatedMinutes={estimatedMinutes}
            />
            <button
              type="button"
              title={t.sunsamaForm.notesBtn}
              onClick={() => setShowNotes((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                showNotes || notes.trim()
                  ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                  : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5 opacity-80" />
              {(showNotes || notes.trim()) && (
                <span className="text-[11px] font-semibold">{t.sunsamaForm.notesBtn}</span>
              )}
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={isDeleting || isLoading}
                className="h-7 text-xs px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 gap-1 cursor-pointer mr-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.sunsamaForm.deleteTask}</span>
              </Button>
            )}
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t.sunsamaForm.cancel}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={!title.trim() || isLoading || isDeleting}
              className="h-7 text-xs px-3 font-medium cursor-pointer"
            >
              {isLoading
                ? (isEditMode ? t.sunsamaForm.saving : t.sunsamaForm.creating)
                : options.requireDuration
                ? t.sunsamaForm.continueBtn
                : isEditMode
                ? t.sunsamaForm.saveChanges
                : t.sunsamaForm.createTask}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={handleDelete}
        title={t.sunsamaForm.confirmDeleteTitle}
        description={t.sunsamaForm.confirmDeleteDesc}
      />
    </>
  );
}
