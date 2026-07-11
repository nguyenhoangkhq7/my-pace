"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
            {/* Rules Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">1. Quy Tắc Trạng Thái (Status Rules)</h3>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <strong>Freeze (Đóng băng):</strong> Trạng thái mặc định khi mới tạo Goal. Thể hiện các mục tiêu bạn muốn làm nhưng chưa thực sự bắt đầu. 
                  <em className="block text-muted-foreground mt-0.5">Lưu ý: Không thể tạo Task cho Goal đang Freeze.</em>
                </li>
                <li>
                  <strong>In Progress (Đang thực hiện):</strong> 
                  <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
                  <div className="mt-1 text-muted-foreground">
                    Mỗi người chỉ được phép có <strong>tối đa 5 Goal In Progress</strong> cùng một thời điểm. Luật này giúp bạn tập trung hoàn thành dứt điểm thay vì ôm đồm quá nhiều việc.
                  </div>
                </li>
                <li>
                  <strong>Done (Hoàn thành):</strong> Goal đã đạt được. Không còn giới hạn.
                </li>
                <li>
                  <strong>Archived (Lưu trữ):</strong> Khi bạn muốn xoá một Goal nhưng nó đã có Task liên kết, hệ thống sẽ tự động đổi sang Archived để không làm mất lịch sử công việc của bạn.
                </li>
              </ul>
            </div>

            {/* Types Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">2. Ba Loại Goal (Goal Types)</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-1">📁 Dự án (Project)</h4>
                  <p className="text-muted-foreground">
                    Dự án có tính chất hoàn thành (ví dụ: Đi du học). Bạn có thể chia nhỏ Dự án thành tối đa <strong>3 cấp Dự án con (Subgoals)</strong>.
                    Việc tạo <strong>Task</strong> được thực hiện trực tiếp, nhanh gọn bên trong Dự án (chỉ cần nhập Tên). Khi muốn tiến hành làm Task nào, bạn bấm nút <strong>&quot;Đưa vào Backlog&quot;</strong> để sẵn sàng lên kế hoạch. Tiến độ tự động tính theo % hoàn thành.
                  </p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-1">⏳ Thói quen (Habit)</h4>
                  <p className="text-muted-foreground">
                    Những hành động lặp đi lặp lại không có Task con (ví dụ: Học tiếng Anh). Bạn quy định: &quot;Dành ra <strong>X phút</strong> trong vòng <strong>Y ngày</strong>&quot;. 
                    Mỗi ngày, bạn tạo ra các &quot;phiên làm việc&quot; (Task thực thi) từ Backlog để hoàn thành mục tiêu thời gian này.
                  </p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-1">🎯 Mục tiêu (Target)</h4>
                  <p className="text-muted-foreground">
                    Cũng không có Task con, nhưng đo lường bằng số lượng (ví dụ: Gọi 50 cuộc khách hàng).
                    Giống như Habit, bạn tạo ra các Task đơn lẻ mỗi ngày để hoàn thành mục tiêu số lượng.
                  </p>
                </div>
              </div>
            </div>

            {/* Philosophy Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">3. Triết Lý Thực Thi (Bottom-Up)</h3>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-sm text-primary-foreground">
                <p className="mb-2"><strong>Daily Plan (Kế hoạch ngày) là trung tâm của mọi hành động.</strong></p>
                <p>Tiến độ của Dự án hay Mục tiêu đều được tích lũy từ chính những Task bạn hoàn thành mỗi ngày.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li><strong>Với Dự án:</strong> Liệt kê các Task cần làm bên trong modal Dự án, sau đó &quot;Đưa vào Backlog&quot;. Trong trang Lên Kế Hoạch, lấy Task từ Backlog Cá Nhân để xếp vào hôm nay.</li>
                  <li><strong>Với Habit / Target:</strong> Không cần liệt kê Task từ trước. Tại trang Lên Kế Hoạch, mở tab &quot;Dự án&quot; (Goal Backlog) và bấm nút &quot;Tạo Task cho Hôm nay&quot; để sinh ra một phiên làm việc.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-sm text-foreground animate-fade-in">
            {/* Rules Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">1. Status Rules</h3>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <strong>Freeze:</strong> Default state when a Goal is created. Represents goals you want to do but haven't started yet.
                  <em className="block text-muted-foreground mt-0.5">Note: You cannot create Tasks for frozen Goals.</em>
                </li>
                <li>
                  <strong>In Progress:</strong> 
                  <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
                  <div className="mt-1 text-muted-foreground">
                    You can have <strong>at most 5 Goals In Progress</strong> at the same time. This rule helps you stay focused on finishing instead of starting too many things.
                  </div>
                </li>
                <li>
                  <strong>Done:</strong> Goal completed. No limitations.
                </li>
                <li>
                  <strong>Archived:</strong> When you delete a Goal that already has linked Tasks, the system automatically archives it to preserve your work history.
                </li>
              </ul>
            </div>

            {/* Types Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">2. Goal Types</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-1">📁 Project</h4>
                  <p className="text-muted-foreground">
                    Goals with an ultimate completion point (e.g. Study abroad). You can divide Projects into up to <strong>3 levels of Subgoals</strong>.
                    Creating a <strong>Task</strong> is done directly inside the Project (just enter a Title). When you want to schedule a Task, click <strong>&quot;Move to Backlog&quot;</strong>. Progress is calculated as a % of completed tasks.
                  </p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-1">⏳ Habit</h4>
                  <p className="text-muted-foreground">
                    Repetitive actions without subtasks (e.g. Learn English). You specify: &quot;Spend <strong>X minutes</strong> within <strong>Y days</strong>&quot;.
                    Each day, you create single "session tasks" from the Backlog to fulfill this time target.
                  </p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-1">🎯 Target</h4>
                  <p className="text-muted-foreground">
                    Also no subtasks, but measured by quantity (e.g. Make 50 customer calls).
                    Similar to Habits, you create individual daily tasks to reach the target count.
                  </p>
                </div>
              </div>
            </div>

            {/* Philosophy Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary border-b border-border pb-1">3. Execution Philosophy (Bottom-Up)</h3>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-sm text-primary-foreground">
                <p className="mb-2"><strong>Daily Plan is the center of all actions.</strong></p>
                <p>Progress on both Projects and Goals is accumulated from the daily tasks you complete.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                  <li><strong>For Projects:</strong> List Tasks inside the Project modal, then &quot;Move to Backlog&quot;. On the Plan page, pull Tasks from your Personal Backlog to schedule them.</li>
                  <li><strong>For Habits / Targets:</strong> No need to pre-list tasks. On the Plan page, open the &quot;Goal Backlog&quot; tab and click &quot;Create Task for Today&quot; to generate a session.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
