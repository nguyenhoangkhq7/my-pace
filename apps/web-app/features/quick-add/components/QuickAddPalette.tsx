"use client";

import { useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { QuickAddInput } from "./QuickAddInput";
import { QuickAddSuggestions } from "./QuickAddSuggestions";
import { SunsamaTaskInput } from "./SunsamaTaskInput";
import { SunsamaEventInput } from "./SunsamaEventInput";
import { QuickAddResultHeader } from "./QuickAddResultHeader";
import { useQuickAdd } from "../hooks/useQuickAdd";
import { useQuickAddUIStore } from "../store/quickAddUI.store";

export function QuickAddPalette() {
  const { isOpen, open, close, autoConfirm } = useQuickAddUIStore();
  const { t } = useTranslation();

  const {
    result,
    status,
    isReporting,
    error,
    parseText,
    reportError,
    confirmCreate,
    toggleType,
    reset,
  } = useQuickAdd();

  // Global "/" shortcut — only when not focused on input/textarea and no other modal is open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      const hasOtherOpenDialog = Boolean(
        document.querySelector('[role="dialog"][data-state="open"]') ||
        document.querySelector('[role="alertdialog"][data-state="open"]')
      );

      if (e.key === "/" && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen && !hasOtherOpenDialog) {
        e.preventDefault();
        open();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isOpen]);

  const handleClose = useCallback(() => {
    reset();
    close();
  }, [reset, close]);

  const handleSubmit = async (text: string) => {
    const res = await parseText(text);
    if (res && autoConfirm) {
      const ok = await confirmCreate(res);
      if (ok) {
        toast.success(res.type === "event" ? t.quickAdd.createdEvent : t.quickAdd.created);
        handleClose();
      }
    }
  };

  const isResultVisible = (status === "preview" || status === "creating") && !!result;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? open() : handleClose())}>
      <DialogContent
        className="sm:max-w-[560px] !top-[18%] !-translate-y-0 p-0 gap-0 rounded-xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>{t.quickAdd.title}</DialogTitle>
        </VisuallyHidden.Root>

        {isResultVisible && (
          <QuickAddResultHeader
            result={result}
            isReporting={isReporting}
            onReportError={reportError}
            onToggleType={toggleType}
          />
        )}

        {isResultVisible ? (
          result?.type === "task" ? (
            <SunsamaTaskInput
              key={`task-${result.title}-${result.dueDate || ""}`}
              initialTitle={result.title}
              initialNotes={result.notes || undefined}
              initialEstimatedMinutes={result.estimatedMinutes || undefined}
              initialDueDate={
                result.dueDate ? new Date(result.dueDate) : undefined
              }
              initialDueTime={
                result.dueDate && result.dueDate.includes("T")
                  ? result.dueDate.split("T")[1].substring(0, 5)
                  : "23:59"
              }
              initialCategoryId={result.categoryId || undefined}
              initialGoalId={result.goalId || undefined}
              initialUrgent={result.isUrgent}
              initialImportant={result.isImportant}
              initialChecklists={
                result.checklists
                  ? result.checklists.map((c) => c.title)
                  : undefined
              }
              onSuccess={handleClose}
              onCancel={handleClose}
              autoFocus={true}
            />
          ) : (
            <SunsamaEventInput
              key={`event-${result.title}-${result.eventDate || ""}`}
              initialTitle={result.title}
              initialNotes={result.notes || undefined}
              initialEventDate={
                result.eventDate ? new Date(result.eventDate) : new Date()
              }
              initialStartTime={result.startTime || "09:00"}
              initialEndTime={result.endTime || "10:00"}
              initialIsAllDay={Boolean(result.isAllDay)}
              initialCategoryId={result.categoryId || undefined}
              initialRecurrenceType={result.recurrenceType || "NONE"}
              initialRecurrenceDaysOfWeek={result.recurrenceDaysOfWeek || undefined}
              initialRecurrenceEndDate={result.recurrenceEndDate || undefined}
              onSuccess={handleClose}
              onCancel={handleClose}
              autoFocus={true}
            />
          )
        ) : (
          <>
            <QuickAddInput onSubmit={handleSubmit} isLoading={status === "loading"} />

            {status === "idle" && (
              <QuickAddSuggestions onSelect={(text) => handleSubmit(text)} />
            )}

            {status === "error" && (
              <div className="px-4 py-4 text-center space-y-2">
                <p className="text-sm font-medium text-rose-500">{t.quickAdd.errorTitle}</p>
                <p className="text-xs text-muted-foreground">{error || t.quickAdd.errorDesc}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
