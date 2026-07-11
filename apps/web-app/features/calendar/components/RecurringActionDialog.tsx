"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface RecurringActionDialogProps {
  open: boolean;
  action: "edit" | "delete";
  onSelectSingle: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
}

export function RecurringActionDialog({
  open,
  action,
  onSelectSingle,
  onSelectAll,
  onCancel,
}: RecurringActionDialogProps) {
  const { t } = useTranslation();
  const isDelete = action === "delete";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isDelete ? t.calendar.deleteRecurring : t.calendar.editRecurring}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t.calendar.recurringQuestion(action)}
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onSelectSingle}
            className="flex flex-col rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
          >
            <span className="font-medium text-sm text-foreground">
              {t.calendar.onlyThis}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {t.calendar.onlyThisDesc(action)}
            </span>
          </button>

          <button
            onClick={onSelectAll}
            className="flex flex-col rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
          >
            <span className="font-medium text-sm text-foreground">
              {t.calendar.allEvents}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {t.calendar.allEventsDesc(action)}
            </span>
          </button>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t.calendar.cancelBtn2}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
