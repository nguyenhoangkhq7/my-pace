import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

interface CancelPlanDialogProps {
  isOpen: boolean;
  activeTab: string;
  onOpenChange: (open: boolean) => void;
  onCancelConfirm: () => void;
}

export function CancelPlanDialog({
  isOpen,
  activeTab,
  onOpenChange,
  onCancelConfirm,
}: CancelPlanDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>{t.board.cancelPlanTitle(activeTab)}</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {t.board.cancelPlanDesc(activeTab)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground hover:bg-muted cursor-pointer">
            {t.board.noKeepIt}
          </Button>
          <Button onClick={onCancelConfirm} className="bg-red-500 hover:bg-red-600 text-white cursor-pointer">
            {t.board.yesCancelPlan}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
