import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore } from "@/features/auth";
import { useTranslation } from "@/hooks/use-translation";
import { ExternalLink } from "lucide-react";

interface AccountTabProps {
  onOpenProfile: () => void;
}

export function AccountTab({ onOpenProfile }: AccountTabProps) {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t.settingsModal.accountTitle}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.settingsModal.accountDesc}
        </p>
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0">
            <HugeiconsIcon icon={UserCircleIcon} size={48} className="text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-foreground">{user?.name || "User"}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</span>
          </div>
        </div>

        <button
          onClick={onOpenProfile}
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg bg-muted/40 hover:bg-accent border border-border/40 transition-colors text-xs font-medium text-foreground cursor-pointer"
        >
          <span>{t.settingsModal.editProfileBtn}</span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
