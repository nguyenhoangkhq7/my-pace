"use client";

import { useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { QuickAddInput } from "./QuickAddInput";
import { QuickAddSuggestions } from "./QuickAddSuggestions";
import { QuickAddPreview } from "./QuickAddPreview";
import { QuickAddForm } from "./QuickAddForm";
import { useQuickAdd } from "../hooks/useQuickAdd";
import { useQuickAddUIStore } from "../store/quickAddUI.store";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useGoals } from "@/features/board/hooks/useGoals";
import { useState } from "react";

export function QuickAddPalette() {
  const { isOpen, open, close } = useQuickAddUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation();
  const { result, status, error, parseText, confirmCreate, toggleType, reset } = useQuickAdd();
  const { categories } = useCategories();
  const { goals } = useGoals();

  // Global "/" shortcut — only when not focused on input/textarea
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "/" && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        open();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = useCallback(() => {
    close();
    setIsEditing(false);
    setTimeout(reset, 200);
  }, [close, reset]);

  const handleSubmit = useCallback(
    async (text: string) => {
      setIsEditing(false);
      await parseText(text);
    },
    [parseText]
  );

  const handleSuggestionSelect = useCallback(
    (text: string) => {
      setIsEditing(false);
      parseText(text);
    },
    [parseText]
  );

  const handleConfirm = useCallback(async () => {
    const success = await confirmCreate();
    if (success) {
      toast.success(t.quickAdd.created);
      handleClose();
    }
  }, [confirmCreate, handleClose, t]);

  const isResultVisible = (status === "preview" || status === "creating") && result;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? open() : handleClose())}>
      <DialogContent
        className="sm:max-w-[680px] !top-[20%] !-translate-y-0 p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>{t.quickAdd.title}</DialogTitle>
        </VisuallyHidden.Root>

        <QuickAddInput onSubmit={handleSubmit} isLoading={status === "loading"} />

        {status === "idle" && <QuickAddSuggestions onSelect={handleSuggestionSelect} />}

        {isResultVisible && !isEditing && (
          <QuickAddPreview
            result={result}
            categories={categories}
            goals={goals}
            onConfirm={handleConfirm}
            onEdit={() => setIsEditing(true)}
            onToggleType={toggleType}
            isCreating={status === "creating"}
          />
        )}

        {isResultVisible && isEditing && (
          <QuickAddForm
            initialData={result}
            onSuccess={() => {
              toast.success(t.quickAdd.created);
              handleClose();
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}

        {status === "error" && (
          <div className="px-4 py-4 text-center space-y-2">
            <p className="text-sm font-medium text-red-400">{t.quickAdd.errorTitle}</p>
            <p className="text-xs text-muted-foreground">{error || t.quickAdd.errorDesc}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

