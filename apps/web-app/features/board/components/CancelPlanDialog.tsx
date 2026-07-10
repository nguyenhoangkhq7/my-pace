import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>Cancel {activeTab === 'today' ? "Today's" : "Tomorrow's"} Plan?</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Bạn có chắc chắn muốn hủy kế hoạch {activeTab === 'today' ? 'hôm nay' : 'ngày mai'}? Các task chưa hoàn thành sẽ được trả về Backlog.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground hover:bg-muted cursor-pointer">
            No, Keep It
          </Button>
          <Button onClick={onCancelConfirm} className="bg-red-500 hover:bg-red-600 text-white cursor-pointer">
            Yes, Cancel Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
