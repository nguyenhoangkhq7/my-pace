import { useTranslation } from "@/hooks/use-translation";
import { Cpu, Calendar, Zap, ShieldCheck } from "lucide-react";

export function MyPaceWorkflowSection() {
  const { t } = useTranslation();
  const guide = t.eisenhowerGuide;

  const STEPS = [
    {
      icon: Cpu,
      title: guide.step1Title,
      desc: guide.step1Desc,
    },
    {
      icon: Calendar,
      title: guide.step2Title,
      desc: guide.step2Desc,
    },
    {
      icon: Zap,
      title: guide.step3Title,
      desc: guide.step3Desc,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {guide.myPaceEngineTitle}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {guide.myPaceEngineSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs hover:border-primary/30 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
