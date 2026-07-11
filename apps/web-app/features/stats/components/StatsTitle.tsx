import { Flame } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface StatsTitleProps {
  title?: string;
  subtitle?: string;
  streak?: number;
}

export function StatsTitle({
  title,
  subtitle,
  streak = 0,
}: StatsTitleProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t.stats.title;
  const displaySubtitle = subtitle ?? t.stats.subtitle;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {displayTitle}
        </h1>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            <span>{t.stats.streak(streak)}</span>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm">{displaySubtitle}</p>
    </div>
  );
}
