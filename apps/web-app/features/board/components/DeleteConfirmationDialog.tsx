import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}: DeleteConfirmationDialogProps) {
  const { t } = useTranslation();
  const finalConfirmText = confirmText || t.deleteConfirm.confirmText;
  const finalCancelText = cancelText || t.deleteConfirm.cancelText;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[360px] max-w-xs rounded-3xl p-6 border-none bg-slate-950 text-slate-50 border-slate-800 shadow-2xl text-center">
        <div className="flex flex-col items-center space-y-4 py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
            <HugeiconsIcon icon={Delete01Icon} size={24} />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center animate-fade-in">
              {description}
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-center gap-3 pt-4 border-t border-border/40 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground flex-1 cursor-pointer"
          >
            {finalCancelText}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white flex-1 transition-all active:scale-[0.97] cursor-pointer"
          >
            {finalConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
