"use client";

import { useTranslation } from "@/hooks/use-translation";

interface QuickAddSuggestionsProps {
  onSelect?: (text: string) => void;
}

export function QuickAddSuggestions({ onSelect }: QuickAddSuggestionsProps) {
  const { t } = useTranslation();

  const examples = [
    t.quickAdd.suggestion1 || "họp team 1 tiếng chiều mai #work",
    t.quickAdd.suggestion3 || "nộp báo cáo trước thứ 6 gấp !q1",
    t.quickAdd.suggestion2 || "đọc sách 30 phút tối nay",
  ];

  return (
    <div className="px-3.5 py-3 sm:px-4 sm:py-2.5 bg-muted/20 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 text-[11px] text-muted-foreground/75 w-full rounded-b-xl">
      {/* Left: Minimal Formula Hint */}
      <div className="flex items-center gap-1.5 truncate">
        <span className="font-medium text-primary">Task</span>
        <span className="text-muted-foreground/60">{t.quickAdd.hintTaskDesc}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="font-medium text-foreground/80">Event</span>
        <span className="text-muted-foreground/60">{t.quickAdd.hintEventDesc}</span>
      </div>

      {/* Right: Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {examples.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect?.(ex)}
            className="text-[11px] px-2 py-0.5 rounded-md bg-background/50 border border-border/40 text-muted-foreground/80 hover:text-foreground hover:border-primary/40 hover:bg-background transition-all duration-150 cursor-pointer shrink-0 truncate max-w-[200px]"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
