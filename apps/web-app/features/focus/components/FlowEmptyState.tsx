import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useBoardStore } from "@/features/board/store/board.store";

export function FlowEmptyState() {
  const { dailyPlanToday, reviewDailyPlan } = useBoardStore();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const allDone = !!dailyPlanToday?.tasks && dailyPlanToday.tasks.length > 0 && dailyPlanToday.tasks.every(t => t.task.status === "Done");

  if (allDone) {
    const totalMinutes = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.actualMinutes || 0), 0);
    const totalEstimated = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.estimatedMinutes || 0), 0);
    const completedCount = dailyPlanToday.tasks.length;
    const isReviewed = dailyPlanToday?.isReviewed || false;

    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-6 relative w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-background to-background pointer-events-none"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          {isReviewed ? (
            <>
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-5xl shadow-[0_0_40px_rgba(16,185,129,0.15)] border border-emerald-500/20 text-emerald-400">
                🎉
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-wide">Tuyệt vời!</h2>
              <p className="text-muted-foreground font-medium">
                Bạn đã hoàn thành tất cả công việc cho hôm nay. Tuyệt vời!
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-5xl shadow-[0_0_40px_rgba(99,102,241,0.15)] border border-indigo-500/20 text-indigo-400">
                📊
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-wide">Kế hoạch hoàn tất!</h2>
              <p className="text-muted-foreground font-medium">
                Hãy nhìn lại những gì bạn đã đạt được trong ngày hôm nay.
              </p>
              <Button onClick={() => setIsReviewModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-full mt-4 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                End-of-Day Review
              </Button>
            </>
          )}
        </div>

        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card text-foreground border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center font-bold tracking-wide">Tổng kết cuối ngày 🌟</DialogTitle>
              <DialogDescription className="text-center pt-2 text-muted-foreground font-medium">
                Dưới đây là những gì bạn đã làm được hôm nay:
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="bg-background border border-border rounded-2xl p-5 text-center">
                <div className="text-5xl font-black text-indigo-400 mb-2 drop-shadow-md">{completedCount}</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tasks Done</div>
              </div>
              <div className="bg-background border border-border rounded-2xl p-5 text-center">
                <div className="text-5xl font-black text-emerald-400 mb-2 drop-shadow-md">{totalMinutes}</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Focus Minutes</div>
              </div>
              <div className="bg-background border border-border rounded-2xl p-5 text-center col-span-2">
                <div className="text-3xl font-bold text-cyan-400 mb-2 drop-shadow-sm">{totalEstimated}m</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Estimated Time Originally</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground font-medium italic pb-4 px-4">
              &quot;Thành công không phải là đích đến, mà là chặng đường bạn đã nỗ lực mỗi ngày.&quot;
            </div>

            <DialogFooter className="flex justify-center sm:justify-center border-t border-border pt-5">
              <Button 
                onClick={() => {
                  setIsReviewModalOpen(false);
                  if (dailyPlanToday) {
                    reviewDailyPlan(dailyPlanToday.planDate);
                  }
                }} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white w-full rounded-full font-bold shadow-lg h-12"
              >
                Tuyệt vời, Đóng lại
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background p-6 relative w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/15 via-background to-background pointer-events-none"></div>
      <div className="max-w-md text-center space-y-6 relative z-10">
        <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-border text-muted-foreground">
          ⏳
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-wide">Sẵn sàng tập trung?</h2>
        <p className="text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
          Chọn một công việc ở cột bên trái để bắt đầu phiên làm việc sâu (Deep Work).
        </p>
      </div>
    </div>
  );
}
