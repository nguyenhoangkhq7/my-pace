"use client";

import { MentionItemData, MentionType } from "../hooks/useQuickAddMention";
import { QuickAddMentionItem } from "./QuickAddMentionItem";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddMentionPopupProps {
  type: MentionType;
  items: MentionItemData[];
  selectedIndex: number;
  onSelect: (item: MentionItemData) => void;
}

export function QuickAddMentionPopup({
  type,
  items,
  selectedIndex,
  onSelect,
}: QuickAddMentionPopupProps) {
  const { t } = useTranslation();

  const title =
    type === "category"
      ? t.quickAdd.mentionCategories
      : type === "goal"
      ? t.quickAdd.mentionGoals
      : t.quickAdd.mentionPriorities;

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[280px] sm:w-[320px] p-1 bg-popover/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/10 max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1.5 duration-150 ease-out">
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 border-b border-border/30 mb-0.5 flex items-center justify-between select-none sticky top-0 bg-popover/95 backdrop-blur-md z-10">
        <span>{title}</span>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-muted-foreground/60 normal-case">
          <span>{t.quickAdd.mentionNavigationHint}</span>
        </span>
      </div>

      <div className="space-y-0.5">
        {items.map((item, idx) => (
          <QuickAddMentionItem
            key={item.id}
            item={item}
            isSelected={idx === selectedIndex}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
