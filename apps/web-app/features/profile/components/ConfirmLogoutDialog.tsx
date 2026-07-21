import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface ConfirmLogoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmLogoutDialog({ isOpen, onOpenChange, onConfirm }: ConfirmLogoutDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[320px] max-w-xs rounded-3xl p-6 border-none bg-card shadow-2xl text-center">
        <div className="flex flex-col items-center space-y-4 py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
            <HugeiconsIcon icon={Logout03Icon} size={24} />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              {t.profile.logoutConfirmTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              {t.profile.logoutConfirmDesc}
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-center gap-3 pt-4 border-t border-border/40 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground flex-1"
          >
            {t.profile.logoutConfirmCancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white flex-1 transition-all active:scale-[0.97]"
          >
            {t.profile.logoutConfirmOk}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
