import { useTranslation } from "@/hooks/use-translation";
import { HelpIcon, FeedbackIcon } from "@/components/layout/SidebarIcons";
import { ChevronRight } from "lucide-react";

interface SupportTabProps {
  onOpenPhilosophy: () => void;
  onOpenFeedback: () => void;
}

export function SupportTab({ onOpenPhilosophy, onOpenFeedback }: SupportTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t.settingsModal.supportTitle}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.settingsModal.supportDesc}
        </p>
      </div>

      <div className="space-y-2.5">
        <button
          onClick={onOpenPhilosophy}
          className="flex items-center justify-between w-full p-3.5 rounded-xl border border-border/50 bg-card/60 hover:bg-accent hover:border-border transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HelpIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">{t.sidebar.philosophy}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t.settingsModal.philosophySub}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={onOpenFeedback}
          className="flex items-center justify-between w-full p-3.5 rounded-xl border border-border/50 bg-card/60 hover:bg-accent hover:border-border transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FeedbackIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">{t.sidebar.feedback}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t.settingsModal.feedbackSub}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
