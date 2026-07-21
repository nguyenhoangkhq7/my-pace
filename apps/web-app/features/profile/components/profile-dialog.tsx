"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/features/auth";
import { ConfirmLogoutDialog } from "./ConfirmLogoutDialog";
import { ProfileFormContent } from "./ProfileFormContent";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-w-lg rounded-3xl p-6 border-none bg-card shadow-2xl overflow-hidden duration-300">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} className="text-primary" size={24} />
              {t.profile.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t.profile.desc}
            </DialogDescription>
          </DialogHeader>

          <ProfileFormContent
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
            onLogoutClick={() => setIsConfirmLogoutOpen(true)}
            isOpen={isOpen}
          />
        </DialogContent>
      </Dialog>

      <ConfirmLogoutDialog
        isOpen={isConfirmLogoutOpen}
        onOpenChange={setIsConfirmLogoutOpen}
        onConfirm={handleLogout}
      />
    </>
  );
}
