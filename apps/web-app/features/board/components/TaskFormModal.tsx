"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { Task } from "../types";
import { SunsamaTaskInput } from "@/features/quick-add/components/SunsamaTaskInput";
import { useTranslation } from "@/hooks/use-translation";

interface TaskFormModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit?: (task: Partial<Task>) => void;
  initialData?: Partial<Task>;
  requireDuration?: boolean;
  prefilledGoalId?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
  planningTarget?: 'today' | 'tomorrow';
  initialStatus?: 'Icebox' | 'Backlog' | 'Picked for Today' | 'Done';
}

export function TaskFormModal(props: TaskFormModalProps) {
  const { t } = useTranslation();
  const handleOpenChange = (open: boolean) => {
    if (props.onOpenChange) props.onOpenChange(open);
    if (!open && props.onClose) props.onClose();
  };

  const isEditMode = !!props.initialData?.id;

  const getInitialDueDate = (): Date | null => {
    if (props.initialData?.id) {
      if (props.initialData.dueDate) {
        const d = new Date(props.initialData.dueDate);
        return !isNaN(d.getTime()) ? d : null;
      }
      return null;
    }
    const d = new Date();
    if (props.planningTarget === "tomorrow") {
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  const getInitialDueTime = (): string => {
    if (props.initialData?.dueDate && props.initialData.dueDate.includes("T")) {
      const timePart = props.initialData.dueDate.split("T")[1];
      if (timePart) return timePart.substring(0, 5);
    }
    return "23:59";
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleOpenChange}>
      {props.isOpen && (
        <DialogContent
          className="sm:max-w-[660px] !top-[20%] !-translate-y-0 p-0 gap-0 bg-card text-card-foreground border-border shadow-2xl overflow-visible"
          showCloseButton={false}
        >
          <VisuallyHidden.Root>
            <DialogTitle>
              {isEditMode ? t.sunsamaForm.editTask : t.sunsamaForm.createTask}
            </DialogTitle>
          </VisuallyHidden.Root>
          <SunsamaTaskInput
            key={props.initialData?.id || "new-task"}
            taskId={props.initialData?.id}
            requireDuration={props.requireDuration}
            onSubmit={props.onSubmit}
            onSuccess={() => {
              props.onClose?.();
            }}
            onCancel={() => {
              props.onClose?.();
            }}
            autoFocus={true}
            initialTitle={props.initialData?.title}
            initialNotes={props.initialData?.notes}
            initialUrgent={props.isUrgent !== undefined ? props.isUrgent : props.initialData?.isUrgent}
            initialImportant={props.isImportant !== undefined ? props.isImportant : props.initialData?.isImportant}
            initialGoalId={props.prefilledGoalId || props.initialData?.goalId}
            initialCategoryId={props.initialData?.categoryId}
            initialEstimatedMinutes={props.initialData?.estimatedMinutes}
            initialIsSplittable={props.initialData?.isSplittable}
            initialMinChunkMinutes={props.initialData?.minChunkMinutes}
            initialMaxDailyDuration={props.initialData?.maxDailyDuration}
            initialChecklists={props.initialData?.checklists?.map((c) => c.title)}
            initialDueDate={getInitialDueDate()}
            initialDueTime={getInitialDueTime()}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
