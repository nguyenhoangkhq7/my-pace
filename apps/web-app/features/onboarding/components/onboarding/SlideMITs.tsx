import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

interface SlideMITsProps {
  isHelpMode?: boolean;
}

export function SlideMITs({ isHelpMode }: SlideMITsProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="w-full flex items-center justify-center" style={{ minHeight: "10rem" }}>
        <div className="relative flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl h-28 w-28 -z-10" />
          <svg className="w-24 h-24 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" className="opacity-80" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <path d="M5 5L7 7M19 5L17 7M5 19L7 17M19 19L17 17" strokeLinecap="round" />
          </svg>
          <div className="absolute top-2 right-2 text-amber-500 animate-bounce">★</div>
          <div className="absolute bottom-2 left-2 text-amber-500 animate-bounce delay-300">★</div>
        </div>
      </div>

      <div className="space-y-2 px-1 w-full">
        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
          {t.onboarding.mitsTitle}
        </DialogTitle>
        <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground">
          <div className="text-sm text-center">
            {isHelpMode ? t.onboarding.mitsDescHelp : t.onboarding.mitsDesc}
          </div>
        </DialogDescription>
      </div>
    </>
  );
}
