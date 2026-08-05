"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";
import { fetchClient, getApiErrorMessage } from "@/lib/fetchClient";
import type { QuickAddResult, QuickAddStatus } from "../types";
import type { CreateEventPayload } from "@/features/calendar/types";

export function useQuickAdd() {
  const [result, setResult] = useState<QuickAddResult | null>(null);
  const [status, setStatus] = useState<QuickAddStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const { createTask } = useTasks();
  const { triggerAutoSchedule } = useAutoSchedule();
  const queryClient = useQueryClient();

  const parseText = async (text: string) => {
    if (!text.trim()) return;

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetchClient.post<QuickAddResult>("quick-add", { text });

      setResult(res.data);
      setStatus("preview");
    } catch (err) {
      setError(getApiErrorMessage(err, "Network error"));
      setStatus("error");
    }
  };

  const confirmCreate = async () => {
    if (!result) return;

    setStatus("creating");

    try {
      if (result.type === "event") {
        const isAllDay = result.isAllDay ?? !result.startTime;
        const inferredEndTime = result.startTime
          ? result.endTime ?? addMinutes(result.startTime, 60)
          : undefined;

        const payload: CreateEventPayload = {
          title: result.title,
          notes: result.notes ?? undefined,
          startTime: isAllDay ? undefined : (result.startTime ? `${result.startTime}:00` : undefined),
          endTime: isAllDay ? undefined : (inferredEndTime ? `${inferredEndTime}:00` : undefined),
          eventDate: result.eventDate ?? new Date().toISOString().split("T")[0],
          isAllDay,
          recurrenceType: (result.recurrenceType as CreateEventPayload["recurrenceType"]) || "NONE",
          recurrenceDaysOfWeek: result.recurrenceDaysOfWeek ?? undefined,
          recurrenceEndDate: result.recurrenceEndDate ?? undefined,
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
  };
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const nextHours = Math.floor(normalizedMinutes / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (normalizedMinutes % 60).toString().padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}

