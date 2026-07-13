import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Task } from "@/features/board/types";
import { useTranslation } from "@/hooks/use-translation";

interface FlowReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  completedCount: number;
  totalMinutes: number;
  totalEstimated: number;
  remainingMinutes: number;
  backlogTasks: Task[];
  onReviewConfirm: () => void;
  onPickTaskClick: () => void;
}

export function FlowReviewModal({
  isOpen,
  onOpenChange,
  completedCount,
  totalMinutes,
  totalEstimated,
  remainingMinutes,
  backlogTasks,
  onReviewConfirm,
  onPickTaskClick,
}: FlowReviewModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground border-border shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold tracking-wide">{t.flow.summaryTitle}</DialogTitle>
          <DialogDescription className="text-center pt-2 text-muted-foreground font-medium">
            {t.flow.summaryDesc}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-6">
          <div className="bg-indigo-950/10 border border-indigo-500/20 hover:border-indigo-500/30 transition-all rounded-2xl p-5 text-center">
            <div className="text-5xl font-black text-indigo-400 mb-2 drop-shadow-md">{completedCount}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.tasksDone}</div>
          </div>
          <div className="bg-emerald-950/10 border border-emerald-500/20 hover:border-emerald-500/30 transition-all rounded-2xl p-5 text-center">
            <div className="text-5xl font-black text-emerald-400 mb-2 drop-shadow-md">{totalMinutes}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.focusMinutes}</div>
          </div>
          <div className="bg-cyan-950/10 border border-cyan-500/20 hover:border-cyan-500/30 transition-all rounded-2xl p-5 text-center col-span-2">
            <div className="text-3xl font-bold text-cyan-400 mb-2 drop-shadow-sm">{totalEstimated}m</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.estimatedTime}</div>
          </div>
        </div>

        <div className="text-center text-xs italic text-muted-foreground/80 font-medium max-w-sm mx-auto leading-relaxed pb-4 px-4">
          {t.flow.quote}
        </div>

        {/* Elegant inline task picker prompting relaxation or extra tasks */}
        {backlogTasks.length > 0 ? (
          <div className="flex flex-col items-center justify-center text-center space-y-1 pb-2 pt-4 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground font-medium">
              {t.flow.takeRest}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.flow.remainingPrompt(remainingMinutes)}
              <span 
                onClick={onPickTaskClick}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline decoration-dotted underline-offset-4 transition-colors"
              >
                {t.flow.addTaskLink}
              </span>
            </p>
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground font-medium pt-2 mt-2">
            {t.flow.allDoneLetRest}
          </div>
        )}

        <DialogFooter className="flex justify-center sm:justify-center border-t border-border pt-5 mt-4">
          <Button 
            onClick={onReviewConfirm} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white w-full rounded-full font-bold shadow-[0_4px_20px_rgba(79,70,229,0.35)] h-12 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {t.flow.closeBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
