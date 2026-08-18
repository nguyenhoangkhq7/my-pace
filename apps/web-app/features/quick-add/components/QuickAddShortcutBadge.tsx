"use client";

import { cn } from "@/lib/utils";

interface QuickAddShortcutBadgeProps {
  symbol: string;
  label: string;
  title: string;
  onClick: () => void;
  accentColor?: string;
}

export function QuickAddShortcutBadge({
  symbol,
  label,
  title,
  onClick,
  accentColor,
}: QuickAddShortcutBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer border select-none shrink-0",
        "bg-background/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/40 hover:border-primary/40 shadow-2xs active:scale-95"
      )}
    >
      <span className={cn("font-semibold font-mono", accentColor || "text-primary")}>
        {symbol}
      </span>
      <span>{label}</span>
    </button>
  );
}
