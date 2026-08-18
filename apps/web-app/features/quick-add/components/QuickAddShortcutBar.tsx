"use client";

import { useTranslation } from "@/hooks/use-translation";
import { QuickAddShortcutBadge } from "./QuickAddShortcutBadge";

interface QuickAddShortcutBarProps {
  onInsertTrigger: (char: "#" | "@" | "!") => void;
}

export function QuickAddShortcutBar({ onInsertTrigger }: QuickAddShortcutBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <QuickAddShortcutBadge
        symbol="#"
        label={t.quickAdd.shortcutCategory}
        title={t.quickAdd.shortcutCategoryTitle}
        onClick={() => onInsertTrigger("#")}
        accentColor="text-emerald-500"
      />
      <QuickAddShortcutBadge
        symbol="@"
        label={t.quickAdd.shortcutGoal}
        title={t.quickAdd.shortcutGoalTitle}
        onClick={() => onInsertTrigger("@")}
        accentColor="text-blue-500"
      />
      <QuickAddShortcutBadge
        symbol="!"
        label={t.quickAdd.shortcutPriority}
        title={t.quickAdd.shortcutPriorityTitle}
        onClick={() => onInsertTrigger("!")}
        accentColor="text-amber-500"
      />
    </div>
  );
}
