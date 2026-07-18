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
  const isEn = t.board.today.toLowerCase() === "today";
  
  const getTabLabel = () => {
    if (activeTab === 'today') return isEn ? "today" : "hôm nay";
    if (activeTab === 'tomorrow') return isEn ? "tomorrow" : "ngày mai";
    if (activeTab === 'day2') return isEn ? "the day after tomorrow" : "ngày kia";
    if (activeTab === 'day3') return isEn ? "3 days from now" : "ngày kìa";
    return activeTab;
  };

  const getTitle = () => {
    if (activeTab === 'today') return t.board.cancelPlanTitle(activeTab);
    if (activeTab === 'tomorrow') return t.board.cancelPlanTitle(activeTab);
    return isEn 
      ? `Cancel Plan for ${getTabLabel()}?`
      : `Hủy kế hoạch ${getTabLabel()}?`;
  };

  const getDescription = () => {
    if (activeTab === 'today') return t.board.cancelPlanDesc(activeTab);
    if (activeTab === 'tomorrow') return t.board.cancelPlanDesc(activeTab);
    return isEn 
      ? `Are you sure you want to cancel your plan for ${getTabLabel()}? Incomplete tasks will be returned to the Backlog.`
      : `Bạn có chắc chắn muốn hủy kế hoạch ${getTabLabel()}? Các công việc chưa hoàn thành sẽ được trả về hàng chờ.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {getDescription()}
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
