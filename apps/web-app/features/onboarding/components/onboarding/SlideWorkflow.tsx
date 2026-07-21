import { Target, Calendar, Clock, Sparkles, CheckSquare } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function SlideWorkflow() {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-purple-500/10 text-purple-500 rounded-xl shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-bold text-foreground">{t.onboarding.wfStep1Title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.onboarding.wfStep1Desc}</p>
        </div>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
          <CheckSquare className="w-5 h-5" />
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-bold text-foreground">{t.onboarding.wfStep2Title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.onboarding.wfStep2Desc}</p>
        </div>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-green-500/10 text-green-500 rounded-xl shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-bold text-foreground">{t.onboarding.wfStep3Title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.onboarding.wfStep3Desc}</p>
        </div>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-orange-500/10 text-orange-500 rounded-xl shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-bold text-foreground">{t.onboarding.wfStep4Title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.onboarding.wfStep4Desc}</p>
        </div>
      </div>

      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-2xl">
        <div className="mt-0.5 p-1.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-bold text-foreground">{t.onboarding.wfStep5Title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.onboarding.wfStep5Desc}</p>
        </div>
      </div>
    </>
  );
}
