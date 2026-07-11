import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatLabel } from "../utils/statsDateUtils";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";

interface DateNavigatorProps {
  start: Date;
  end: Date;
  range: "week" | "month" | "year";
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavigator({
  start,
  end,
  range,
  onPrev,
  onNext,
}: DateNavigatorProps) {
  const { locale } = useLanguageStore();

  return (
    <div className="flex items-center gap-3 px-2 border-r border-border/60">
      <button
        onClick={onPrev}
        className="p-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs font-semibold text-foreground min-w-[150px] text-center">
        {formatLabel(start, end, range, locale)}
      </span>
      <button
        onClick={onNext}
        className="p-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
