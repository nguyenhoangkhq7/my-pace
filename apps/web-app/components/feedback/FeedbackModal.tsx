import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { cn } from "@/lib/utils";

interface FeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { id: "BUG", label: "Báo lỗi", icon: "🐛" },
  { id: "FEATURE_REQUEST", label: "Gợi ý", icon: "💡" },
  { id: "OTHER", label: "Khác", icon: "💬" },
];

export function FeedbackModal({ isOpen, onOpenChange }: FeedbackModalProps) {
  const [category, setCategory] = useState("BUG");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung góp ý nhé.");
      return;
    }

    try {
      setIsSubmitting(true);
      await feedbackApi.createFeedback({ category, content });
      toast.success("Cảm ơn bạn đã góp ý! Ý kiến của bạn đã được ghi nhận.");
      setContent("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại sau.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Góp ý & Phản hồi</DialogTitle>
          <DialogDescription>
            Cảm ơn bạn đã trải nghiệm MyPACE. Mọi góp ý của bạn đều rất quý giá.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium leading-none">Bạn muốn góp ý về vấn đề gì?</h4>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-sm transition-all",
                    category === cat.id 
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-xs text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium leading-none">Nội dung chi tiết</h4>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ suy nghĩ của bạn ở đây..."
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
