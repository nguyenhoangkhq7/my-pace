"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useGoals } from "@/features/board/hooks/useGoals";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";
import { fetchClient } from "@/lib/fetchClient";
import type { QuickAddResult, QuickAddStatus } from "../types";
import type { CreateEventPayload } from "@/features/calendar/types";

export function useQuickAdd() {
  const [result, setResult] = useState<QuickAddResult | null>(null);
  const [status, setStatus] = useState<QuickAddStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { categories } = useCategories();
  const { goals } = useGoals();
  const { createTask } = useTasks();
  const { triggerAutoSchedule } = useAutoSchedule();
  const queryClient = useQueryClient();

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
      if (result.type === "event") {
        const payload: CreateEventPayload = {
          title: result.title,
          notes: result.notes ?? undefined,
          startTime: result.startTime ? `${result.startTime}:00` : "09:00:00",
          endTime: result.endTime ? `${result.endTime}:00` : "10:00:00",
          eventDate: result.eventDate ?? new Date().toISOString().split("T")[0],
          isAllDay: !result.startTime,
          recurrenceType: "NONE",
          categoryId: result.categoryId ?? undefined,
        };
        await fetchClient.post("calendar/events", payload);
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        queryClient.invalidateQueries({ queryKey: ["availableTime"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        triggerAutoSchedule();
      } else {
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
      }

      setStatus("idle");
      setResult(null);
      return true;
    } catch {
      setError(result.type === "event" ? "Failed to create event" : "Failed to create task");
      setStatus("error");
      return false;
    }
  };

  const toggleType = () => {
    if (!result) return;
    if (result.type === "task") {
      setResult({
        type: "event",
        title: result.title,
        eventDate: result.dueDate ? result.dueDate.split("T")[0] : new Date().toISOString().split("T")[0],
        startTime: result.dueDate && result.dueDate.includes("T") ? result.dueDate.split("T")[1].slice(0, 5) : "09:00",
        endTime: "10:00",
        categoryId: result.categoryId,
        notes: result.notes,
      });
    } else {
      setResult({
        type: "task",
        title: result.title,
        estimatedMinutes: 60,
        isUrgent: false,
        isImportant: true,
        dueDate: result.eventDate ? `${result.eventDate}T${result.startTime || "09:00"}:00` : null,
        categoryId: result.categoryId,
        goalId: null,
        notes: result.notes,
        checklists: null,
      });
    }
  };

  const reset = () => {
    setResult(null);
    setStatus("idle");
    setError(null);
  };

  const updateResult = (patch: Partial<QuickAddResult>) => {
    if (result) setResult({ ...result, ...patch } as QuickAddResult);
  };

  return {
    result,
    status,
    error,
    parseText,
    confirmCreate,
    toggleType,
    reset,
    updateResult,
    categories,
    goals,
  };
}

