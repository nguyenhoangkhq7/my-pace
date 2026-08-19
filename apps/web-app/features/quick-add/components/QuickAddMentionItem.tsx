"use client";

import { useEffect, useRef } from "react";
import { Target, CornerDownLeft } from "lucide-react";
import { MentionItemData } from "../hooks/useQuickAddMention";
import { cn } from "@/lib/utils";

interface QuickAddMentionItemProps {
  item: MentionItemData;
  isSelected: boolean;
  onSelect: (item: MentionItemData) => void;
}

export function QuickAddMentionItem({
  item,
  isSelected,
  onSelect,
}: QuickAddMentionItemProps) {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && itemRef.current) {
      const item = itemRef.current;
      const container = item.closest(".overflow-y-auto") as HTMLElement | null;
      if (container) {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (itemTop < containerTop) {
          container.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.clientHeight;
        }
      }
    }
  }, [isSelected]);

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-100 text-left cursor-pointer select-none",
        isSelected
          ? "bg-primary/10 text-primary font-medium shadow-2xs"
          : "text-foreground hover:bg-muted/60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {item.type === "category" && (
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 shadow-2xs"
            style={{ backgroundColor: item.color || "#888" }}
          />
        )}

        {item.type === "goal" && (
          <Target className="w-3.5 h-3.5 text-primary shrink-0 opacity-80" />
        )}

        {item.type === "priority" && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: item.color || "#ef4444" }}
          />
        )}

        <span className="truncate">{item.title}</span>
      </div>

      <div className="flex items-center gap-1.5 ml-2 shrink-0">
        {item.subtitle && (
          <span className="text-[11px] text-muted-foreground/75 truncate font-normal">
            {item.subtitle}
          </span>
        )}
        {isSelected && (
          <CornerDownLeft className="w-3 h-3 text-primary/60" />
        )}
      </div>
    </button>
  );
}
