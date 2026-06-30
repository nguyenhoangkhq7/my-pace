"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RecurringActionDialogProps {
  open: boolean;
  action: "edit" | "delete";
  onSelectSingle: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
}

export function RecurringActionDialog({
  open,
  action,
  onSelectSingle,
  onSelectAll,
  onCancel,
}: RecurringActionDialogProps) {
  const isDelete = action === "delete";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isDelete ? "Xóa sự kiện lặp lại" : "Chỉnh sửa sự kiện lặp lại"}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Bạn muốn {isDelete ? "xóa" : "chỉnh sửa"} mục nào?
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onSelectSingle}
            className="flex flex-col rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
          >
            <span className="font-medium text-sm text-foreground">
              Chỉ sự kiện này
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Chỉ {isDelete ? "xóa" : "thay đổi"} riêng ngày được chọn
            </span>
          </button>

          <button
            onClick={onSelectAll}
            className="flex flex-col rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
          >
            <span className="font-medium text-sm text-foreground">
              Tất cả sự kiện
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Áp dụng {isDelete ? "xóa" : "thay đổi"} cho toàn bộ chuỗi lặp
            </span>
          </button>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
