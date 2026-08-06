"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddTriggerBtnProps {
  isCollapsed: boolean;
  onClick: () => void;
}

export function QuickAddTriggerBtn({ isCollapsed, onClick }: QuickAddTriggerBtnProps) {
  const { t } = useTranslation();

  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        title={t.quickAdd.title}
        className={cn(
          "flex w-full items-center justify-center",
          "h-9 w-9 mx-auto rounded-lg",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 active:scale-95",
          "transition-all duration-150 shadow-sm",
        )}
      >
        <HugeiconsIcon icon={SparklesIcon} size={16} className="shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2",
        "rounded-lg border border-dashed border-primary/40",
        "text-sm font-medium text-primary/80",
        "hover:border-primary hover:text-primary hover:bg-primary/5",
        "active:scale-[0.98]",
        "transition-all duration-150",
        "group",
      )}
    >
      <HugeiconsIcon
        icon={SparklesIcon}
        size={15}
        className="shrink-0 transition-transform duration-200 group-hover:rotate-12"
      />
      <span className="flex-1 text-left text-[13px]">{t.quickAdd.title}</span>
      <kbd className="inline-flex items-center rounded border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-[10px] font-mono text-primary/50">
        /
      </kbd>
    </button>
  );
}

