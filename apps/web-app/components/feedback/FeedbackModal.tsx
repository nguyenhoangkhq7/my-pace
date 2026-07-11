import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface FeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { id: "BUG", icon: "🐛" },
  { id: "FEATURE_REQUEST", icon: "💡" },
  { id: "OTHER", icon: "💬" },
];

export function FeedbackModal({ isOpen, onOpenChange }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState("BUG");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error(t.feedback.toastEmpty);
      return;
    }

    try {
      setIsSubmitting(true);
      await feedbackApi.createFeedback({ category, content });
      toast.success(t.feedback.toastSuccess);
      setContent("");
      onOpenChange(false);
    } catch (error) {
      toast.error(t.feedback.toastError);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (id: string) => {
    if (id === "BUG") return t.feedback.bug;
    if (id === "FEATURE_REQUEST") return t.feedback.suggestion;
    return t.feedback.other;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.feedback.title}</DialogTitle>
          <DialogDescription>
            {t.feedback.desc}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium leading-none">{t.feedback.question}</h4>
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
                  <span className="font-medium text-xs text-center">{getCategoryLabel(cat.id)}</span>
                </button>
              ))}
            </div>
          </div>
 
          <div className="space-y-3">
            <h4 className="text-sm font-medium leading-none">{t.feedback.details}</h4>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.feedback.placeholder}
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>
 
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t.feedback.submitting : t.feedback.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
