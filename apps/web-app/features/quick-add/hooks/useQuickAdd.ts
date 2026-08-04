"use client";

import { useState } from "react";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useGoals } from "@/features/board/hooks/useGoals";
import { useTasks } from "@/features/board/hooks/useTasks";
import type { QuickAddResult, QuickAddStatus } from "../types";

export function useQuickAdd() {
  const [result, setResult] = useState<QuickAddResult | null>(null);
  const [status, setStatus] = useState<QuickAddStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { categories } = useCategories();
  const { goals } = useGoals();
  const { createTask } = useTasks();

  const parseText = async (text: string) => {
    if (!text.trim()) return;

    setStatus("loading");
    setError(null);
    setResult(null);

    const now = new Date();
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          goals: goals
            .filter((g) => g.status === "In Progress")
            .map((g) => ({ id: g.id, title: g.title })),
          currentDateTime: now.toISOString().slice(0, 19),
          dayOfWeek: days[now.getDay()],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Unknown error");
        setStatus("error");
        return;
      }

      setResult(json.data);
      setStatus("preview");
    } catch {
      setError("Network error");
      setStatus("error");
    }
  };

  const confirmCreate = async () => {
    if (!result) return;

    setStatus("creating");

    try {
      await createTask({
        title: result.title,
        estimatedMinutes: result.estimatedMinutes ?? undefined,
        isUrgent: result.isUrgent,
        isImportant: result.isImportant,
        dueDate: result.dueDate ?? undefined,
        categoryId: result.categoryId ?? undefined,
        goalId: result.goalId ?? undefined,
        notes: result.notes ?? undefined,
        checklists: result.checklists ?? undefined,
      } as Parameters<typeof createTask>[0]);

      setStatus("idle");
      setResult(null);
      return true;
    } catch {
      setError("Failed to create task");
      setStatus("error");
      return false;
    }
  };

  const reset = () => {
    setResult(null);
    setStatus("idle");
    setError(null);
  };

  const updateResult = (patch: Partial<QuickAddResult>) => {
    if (result) setResult({ ...result, ...patch });
  };

  return {
    result,
    status,
    error,
    parseText,
    confirmCreate,
    reset,
    updateResult,
    categories,
    goals,
  };
}
