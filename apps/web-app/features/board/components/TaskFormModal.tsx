import { Dialog } from "@/components/ui/dialog";
import { Task } from "../types";
import { TaskFormContent } from "./TaskFormContent";

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
  const handleOpenChange = (open: boolean) => {
    if (props.onOpenChange) props.onOpenChange(open);
    if (!open && props.onClose) props.onClose();
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleOpenChange}>
      {props.isOpen && <TaskFormContent {...props} />}
    </Dialog>
  );
}
