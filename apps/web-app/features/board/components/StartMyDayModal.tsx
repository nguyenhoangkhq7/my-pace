"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBoardStore } from "../store/board.store";
import { useCalendarStore } from "@/features/calendar/store/calendar.store";
import { useAuthStore } from "@/features/auth";
import { autoSchedule } from "../utils/autoSchedule";
import { toast } from "sonner";

interface StartMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayStr: string;
}

export function StartMyDayModal({ isOpen, onClose, todayStr }: StartMyDayModalProps) {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState(false);
  const { dailyPlanToday, saveTimeBlocks } = useBoardStore();
  const { events: fixedEvents } = useCalendarStore();
  const user = useAuthStore((s) => s.user);

  const handleManualSchedule = () => {
    onClose();
    router.push(`/calendar?view=day&date=${todayStr}`);
  };

  const handleAutoSchedule = async () => {
    if (!dailyPlanToday || !user?.wakeTime || !user?.sleepTime) {
      toast.error("Không thể tự động lên lịch. Hãy kiểm tra lại cài đặt giờ thức/ngủ.");
      return;
    }

    setIsScheduling(true);
    try {
      const blocks = autoSchedule(
        dailyPlanToday.tasks,
        fixedEvents,
        dailyPlanToday.id,
        todayStr,
        user.wakeTime,
        user.sleepTime
      );

      if (blocks.length === 0) {
        toast.warning("Không còn đủ thời gian trống hôm nay để lên lịch tự động.");
        onClose();
        return;
      }

      await saveTimeBlocks(blocks);
      toast.success("Đã tự động sắp xếp lịch thành công!");
      onClose();
      router.push(`/calendar?view=day&date=${todayStr}`);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tự động lên lịch.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">🚀</div>
            <DialogTitle className="text-xl">Start My Day</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed pt-1">
            Bạn có muốn phân bổ thời gian cụ thể cho các công việc hôm nay không?
            Hệ thống sẽ giúp bạn sắp xếp{" "}
            <span className="text-primary font-medium">{dailyPlanToday?.tasks?.length || 0} task</span>{" "}
            vào các khung giờ còn trống.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4">
          {/* Auto Schedule Card */}
          <button
            onClick={handleAutoSchedule}
            disabled={isScheduling}
            className="group relative flex flex-col items-start p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-lg">⚡</div>
              <span className="font-semibold text-slate-100">Auto-Schedule</span>
              {isScheduling && <span className="text-xs text-primary animate-pulse ml-auto">Đang xử lý...</span>}
            </div>
            <p className="text-sm text-slate-400 leading-snug">
              Tôi muốn hệ thống tự động sắp xếp các task vào lịch, tôn trọng độ ưu tiên và các sự kiện cố định.
            </p>
          </button>

          {/* Manual Schedule Card */}
          <button
            onClick={handleManualSchedule}
            className="group flex flex-col items-start p-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-lg">✋</div>
              <span className="font-semibold text-slate-200">Manual Schedule</span>
            </div>
            <p className="text-sm text-slate-400 leading-snug">
              Tôi muốn tự kéo thả các task vào lịch để kiểm soát chính xác thời gian bắt đầu và kết thúc.
            </p>
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            Bỏ qua, tôi chỉ cần danh sách
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
