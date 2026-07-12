import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PhilosophyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  detail: string;
}

export function PhilosophyDetailModal({ isOpen, onClose, title, detail }: PhilosophyDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] rounded-3xl p-8 border-none bg-card shadow-2xl overflow-y-auto max-h-[90vh] duration-300 scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary mb-4">{title}</DialogTitle>
        </DialogHeader>
        <div className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {detail}
        </div>
      </DialogContent>
    </Dialog>
  );
}
