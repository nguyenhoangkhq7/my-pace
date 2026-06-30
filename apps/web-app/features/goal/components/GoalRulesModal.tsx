"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface GoalRulesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalRulesModal({ isOpen, onOpenChange }: GoalRulesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Hướng Dẫn Quản Lý Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 text-sm text-foreground">
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
                <h4 className="font-semibold text-foreground mb-1">⏳ Time-boxed (Đo bằng thời gian)</h4>
                <p className="text-muted-foreground">
                  Thích hợp cho các mục tiêu thói quen hoặc tích luỹ giờ bay (ví dụ: Học IELTS, Tập Gym). 
                  Bạn sẽ quy định: "Tôi muốn dành ra <strong>X phút</strong> trong vòng <strong>Y ngày</strong> cho mục tiêu này".
                </p>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-1">🚩 Milestone (Đo bằng cột mốc)</h4>
                <p className="text-muted-foreground">
                  Dành cho các dự án lớn có thể chia nhỏ thành nhiều chặng. 
                  Ví dụ mục tiêu "Làm Web App" có các mốc: 1. Làm UI, 2. Làm API, 3. Deploy. 
                  Tiến độ sẽ được tính dựa trên số lượng cột mốc bạn check hoàn thành.
                </p>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-1">🎯 Binary (Đạt hoặc Không)</h4>
                <p className="text-muted-foreground">
                  Mục tiêu chỉ có 2 kết quả là Xong hoặc Chưa Xong, không cần theo dõi thời gian hay cột mốc trung gian.
                  Ví dụ: "Thi đậu bằng lái xe B2". Bạn chỉ cần đổi trạng thái thành Done khi đã đạt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
