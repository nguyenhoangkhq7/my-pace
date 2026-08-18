"use client";

import { useState, useMemo, useCallback } from "react";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useGoals } from "@/features/board/hooks/useGoals";
import { useTranslation } from "@/hooks/use-translation";

export type MentionType = "category" | "goal" | "priority";

export interface MentionItemData {
  id: string;
  type: MentionType;
  title: string;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export function useQuickAddMention(
  value: string,
  setValue: (val: string) => void,
  inputRef: React.RefObject<HTMLInputElement | null>
) {
  const { t } = useTranslation();
  const { categories } = useCategories();
  const { goals } = useGoals();

  const [activeTrigger, setActiveTrigger] = useState<{
    type: MentionType;
    index: number;
    query: string;
  } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const priorities: MentionItemData[] = useMemo(
    () => [
      { id: "!q1", type: "priority", title: t.quickAdd.priorityQ1Title, subtitle: t.quickAdd.priorityQ1Desc, color: "#ef4444" },
      { id: "!q2", type: "priority", title: t.quickAdd.priorityQ2Title, subtitle: t.quickAdd.priorityQ2Desc, color: "#3b82f6" },
      { id: "!q3", type: "priority", title: t.quickAdd.priorityQ3Title, subtitle: t.quickAdd.priorityQ3Desc, color: "#f59e0b" },
      { id: "!q4", type: "priority", title: t.quickAdd.priorityQ4Title, subtitle: t.quickAdd.priorityQ4Desc, color: "#6b7280" },
    ],
    [t]
  );

  const defaultCategories: MentionItemData[] = useMemo(
    () => [
      { id: "work", type: "category", title: "Work", color: "#3b82f6" },
      { id: "personal", type: "category", title: "Personal", color: "#f59e0b" },
      { id: "study", type: "category", title: "Study", color: "#8b5cf6" },
      { id: "health", type: "category", title: "Health", color: "#10b981" },
      { id: "daily", type: "category", title: "Daily", color: "#06b6d4" },
      { id: "finance", type: "category", title: "Finance", color: "#ec4899" },
    ],
    []
  );

  const items: MentionItemData[] = useMemo(() => {
    if (!activeTrigger) return [];
    const q = activeTrigger.query.toLowerCase().trim();

    if (activeTrigger.type === "category") {
      const sourceCategories = categories.length > 0
        ? categories.map((c) => ({ id: c.id, type: "category" as const, title: c.name, color: c.color }))
        : defaultCategories;

      return sourceCategories.filter((c) => !q || c.title.toLowerCase().includes(q));
    }

    if (activeTrigger.type === "goal") {
      const inProgress = goals.filter((g) => g.status === "In Progress");
      if (inProgress.length === 0) {
        return [
          {
            id: "no-goal",
            type: "goal",
            title: t.quickAdd.noMatchingGoals,
            subtitle: t.quickAdd.createGoalPrompt,
          },
        ];
      }
      return inProgress
        .filter((g) => !q || g.title.toLowerCase().includes(q))
        .map((g) => {
          const catName = categories.find((c) => c.id === g.categoryId)?.name;
          return { id: g.id, type: "goal", title: g.title, subtitle: catName };
        });
    }

    if (activeTrigger.type === "priority") {
      return priorities.filter(
        (p) => !q || p.id.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || (p.subtitle && p.subtitle.toLowerCase().includes(q))
      );
    }

    return [];
  }, [activeTrigger, categories, goals, priorities, defaultCategories, t]);

  const updateMentionState = useCallback((text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastHash = textBeforeCursor.lastIndexOf("#");
    const lastAt = textBeforeCursor.lastIndexOf("@");
    const lastExcl = textBeforeCursor.lastIndexOf("!");

    const triggerIdx = Math.max(lastHash, lastAt, lastExcl);

    if (triggerIdx === -1) {
      setActiveTrigger(null);
      return;
    }

    // Must be at start or preceded by whitespace
    if (triggerIdx > 0 && !/\s/.test(textBeforeCursor[triggerIdx - 1])) {
      setActiveTrigger(null);
      return;
    }

    const char = textBeforeCursor[triggerIdx];
    const query = textBeforeCursor.slice(triggerIdx + 1);

    // If query contains spaces (except short goal queries), don't trigger
    if (char === "#" && query.includes(" ")) {
      setActiveTrigger(null);
      return;
    }
    if (char === "!" && query.includes(" ")) {
      setActiveTrigger(null);
      return;
    }

    const type: MentionType = char === "#" ? "category" : char === "@" ? "goal" : "priority";
    setActiveTrigger((prev) => {
      if (prev && prev.type === type && prev.index === triggerIdx && prev.query === query) {
        return prev;
      }
      setSelectedIndex(0);
      return { type, index: triggerIdx, query };
    });
  }, []);

  const applyMention = useCallback(
    (item: MentionItemData) => {
      if (!activeTrigger) return;
      const input = inputRef.current;
      const cursorPos = input?.selectionStart ?? value.length;

      let replacement = "";
      if (item.type === "category") {
        replacement = `#${item.title.replace(/\s+/g, "_")} `;
      } else if (item.type === "goal") {
        replacement = `@${item.title} `;
      } else if (item.type === "priority") {
        replacement = `${item.id} `;
      }

      const before = value.slice(0, activeTrigger.index);
      const after = value.slice(cursorPos);
      const nextValue = `${before}${replacement}${after}`;

      setValue(nextValue);
      setActiveTrigger(null);

      setTimeout(() => {
        if (input) {
          const newPos = before.length + replacement.length;
          input.focus();
          input.setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [activeTrigger, value, setValue, inputRef]
  );

  const insertTrigger = useCallback(
    (char: "#" | "@" | "!") => {
      const input = inputRef.current;
      if (!input) return;

      const cursorPos = input.selectionStart ?? value.length;
      const needsLeadingSpace = cursorPos > 0 && !/\s$/.test(value.slice(0, cursorPos));
      const textToInsert = `${needsLeadingSpace ? " " : ""}${char}`;

      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);
      const nextValue = `${before}${textToInsert}${after}`;

      setValue(nextValue);

      setTimeout(() => {
        const newPos = cursorPos + textToInsert.length;
        input.focus();
        input.setSelectionRange(newPos, newPos);
        updateMentionState(nextValue, newPos);
      }, 0);
    },
    [value, setValue, inputRef, updateMentionState]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): boolean => {
      if (!activeTrigger || items.length === 0) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }

      if (e.key === "Enter" || e.key === "Tab") {
        if (items[selectedIndex]) {
          e.preventDefault();
          applyMention(items[selectedIndex]);
          return true;
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setActiveTrigger(null);
        return true;
      }

      return false;
    },
    [activeTrigger, items, selectedIndex, applyMention]
  );

  return {
    isOpen: Boolean(activeTrigger && items.length > 0),
    activeTriggerType: activeTrigger?.type ?? null,
    items,
    selectedIndex,
    updateMentionState,
    applyMention,
    insertTrigger,
    handleKeyDown,
    closeMention: () => setActiveTrigger(null),
  };
}
