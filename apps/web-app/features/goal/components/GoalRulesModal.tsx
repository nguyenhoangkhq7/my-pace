"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";

interface GoalRulesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalRulesModal({ isOpen, onOpenChange }: GoalRulesModalProps) {
  const { locale } = useLanguageStore();
  const isVi = locale === "vi";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isVi ? "Hướng Dẫn Quản Lý Goal" : "Goal Management Guide"}
          </DialogTitle>
        </DialogHeader>

        {isVi ? (
          <div className="space-y-6 py-4 text-sm text-foreground animate-fade-in">
            {/* Types Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">Hai Loại Mục Tiêu (Goal Types)</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 p-3.5 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">🎯 Cột mốc (Milestone)</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-rose-500/80 font-medium">Khó khăn:</strong> Bạn có một mục tiêu lớn (VD: Đạt 7.0 IELTS, Xây dựng website) nhưng dễ bị ngợp vì không biết bắt đầu từ đâu.
                    </p>
                    <p>
                      <strong className="text-teal-500/90 font-medium">MyPACE giải quyết:</strong> Cho phép bạn &quot;chẻ nhỏ&quot; mục tiêu lớn thành các Task và Checklist cụ thể. Mỗi ngày, bạn chỉ cần chọn ra những Task quan trọng nhất để làm. Tiến độ sẽ tự động cộng dồn cho đến khi mục tiêu hoàn thành.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 p-3.5 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">⏳ Thói quen (Habit)</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-rose-500/80 font-medium">Khó khăn:</strong> Bạn muốn duy trì việc đọc sách 30 phút mỗi ngày, nhưng lại hay quên hoặc lười ghi chép lại thời gian thực hiện.
                    </p>
                    <p>
                      <strong className="text-teal-500/90 font-medium">MyPACE giải quyết:</strong> Bạn chỉ cần thiết lập 1 lần. Hệ thống sẽ tự động tạo Task mỗi ngày theo lịch trình của bạn. Khi làm, chỉ cần bật đồng hồ đếm ngược, MyPACE sẽ theo dõi và ghi nhận mọi nỗ lực của bạn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-sm text-foreground animate-fade-in">
            {/* Types Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">Goal Types</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 p-3.5 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">🎯 Milestone</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-rose-500/80 font-medium">The Pain Point:</strong> You have a large ambition (e.g., passing the IELTS, building an app) but feel overwhelmed and don&apos;t know where to start.
                    </p>
                    <p>
                      <strong className="text-teal-500/90 font-medium">How MyPACE Helps:</strong> We allow you to break down your giant goal into bite-sized Tasks and Checklists. Pick the most important tasks to focus on each day, and watch your progress bar fill up as you conquer them.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 p-3.5 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2">⏳ Habit</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-rose-500/80 font-medium">The Pain Point:</strong> You want to build a continuous routine, like reading 30 minutes a day, but struggle with consistency and tracking.
                    </p>
                    <p>
                      <strong className="text-teal-500/90 font-medium">How MyPACE Helps:</strong> Set your schedule once, and the app will automatically generate daily tasks for you. Just start the timer, focus, and let the system track your streak and effort.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
