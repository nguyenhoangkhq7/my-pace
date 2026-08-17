"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";
import { fetchClient, getApiErrorMessage } from "@/lib/fetchClient";
import type { QuickAddResult, QuickAddStatus } from "../types";
import type { CreateEventPayload } from "@/features/calendar/types";

export function useQuickAdd() {
  const [result, setResult] = useState<QuickAddResult | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [status, setStatus] = useState<QuickAddStatus>("idle");
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { createTask } = useTasks();
  const { triggerAutoSchedule } = useAutoSchedule();
  const queryClient = useQueryClient();

  const parseText = async (
    text: string,
    options?: { forceAi?: boolean }
  ): Promise<QuickAddResult | null> => {
    if (!text.trim()) return null;

    setStatus("loading");
    setError(null);
    setRawText(text);

    try {
      const res = await fetchClient.post<QuickAddResult>("quick-add", {
        text,
        forceAi: Boolean(options?.forceAi),
      });

      setResult(res.data);
      setStatus("preview");
      return res.data;
    } catch (err) {
      setError(getApiErrorMessage(err, "Network error"));
      setStatus("error");
      return null;
    }
  };

  const reportError = async (feedbackNote?: string): Promise<boolean> => {
    if (!result || !rawText) return false;

    setIsReporting(true);
    const prevSource = result.source;
    const note = typeof feedbackNote === "string" ? feedbackNote : "User reported incorrect parsing";

    try {
      // 1. Send feedback payload to system with clean plain object
      await fetchClient.post("feedbacks", {
        category: "QUICK_ADD_ERROR",
        content: JSON.stringify({
          rawText,
          source: prevSource || "UNKNOWN",
          parsedResult: {
            type: result.type,
            title: result.title,
            dueDate: result.type === "task" ? result.dueDate : undefined,
            eventDate: result.type === "event" ? result.eventDate : undefined,
            startTime: result.type === "event" ? result.startTime : undefined,
            endTime: result.type === "event" ? result.endTime : undefined,
            notes: result.notes,
            estimatedMinutes: result.estimatedMinutes,
          },
          note,
          timestamp: new Date().toISOString(),
        }),
      });

      // 2. If it was Fast Path, automatically re-extract using AI Mode behind the scenes
      if (prevSource === "FAST_PATH") {
        toast.info("Đang gửi báo cáo...", { duration: 1500 });
        const aiResult = await parseText(rawText, { forceAi: true });
        if (aiResult) {
          toast.success("Đã ghi nhận báo cáo và cập nhật lại!");
          return true;
        }
      } else {
        toast.success("Đã ghi nhận báo cáo lỗi để cải thiện hệ thống!");
        return true;
      }
      return false;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi báo cáo"));
      return false;
    } finally {
      setIsReporting(false);
    }
  };

  const confirmCreate = async (targetResult?: QuickAddResult) => {
    const data = targetResult || result;
    if (!data) return false;

    setStatus("creating");

    try {
      if (data.type === "event") {
        const isAllDay = Boolean(data.isAllDay);
        const startTimeStr = data.startTime || "09:00";
        const inferredEndTime = data.endTime || addMinutes(startTimeStr, 60);

        const payload: CreateEventPayload = {
          title: data.title,
          notes: data.notes ?? undefined,
          startTime: isAllDay ? undefined : `${startTimeStr}:00`,
          endTime: isAllDay ? undefined : `${inferredEndTime}:00`,
          eventDate: data.eventDate ?? format(new Date(), "yyyy-MM-dd"),
          isAllDay,
          recurrenceType: (data.recurrenceType as CreateEventPayload["recurrenceType"]) || "NONE",
          recurrenceDaysOfWeek: data.recurrenceDaysOfWeek ?? undefined,
          recurrenceEndDate: data.recurrenceEndDate ?? undefined,
          categoryId: data.categoryId ?? undefined,
        };
        await fetchClient.post("calendar/events", payload);
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        queryClient.invalidateQueries({ queryKey: ["availableTime"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        triggerAutoSchedule();
      } else {
        await createTask({
          title: data.title,
          estimatedMinutes: data.estimatedMinutes ?? undefined,
          isUrgent: data.isUrgent,
          isImportant: data.isImportant,
          dueDate: data.dueDate ?? undefined,
          categoryId: data.categoryId ?? undefined,
          goalId: data.goalId ?? undefined,
          notes: data.notes ?? undefined,
          checklists: data.checklists ?? undefined,
        } as Parameters<typeof createTask>[0]);
      }

      setStatus("idle");
      setResult(null);
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, data.type === "event" ? "Failed to create event" : "Failed to create task");
      setError(msg);
      toast.error(msg);
      setStatus("error");
      return false;
    }
  };

  const toggleType = () => {
    if (!result) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");

    if (result.type === "task") {
      const eventDate = result.dueDate ? result.dueDate.split("T")[0] : todayStr;
      const startTime = result.dueDate && result.dueDate.includes("T") ? result.dueDate.split("T")[1].slice(0, 5) : "09:00";
      const duration = result.estimatedMinutes || 60;
      const endTime = addMinutes(startTime, duration);

      setResult({
        type: "event",
        title: result.title,
        eventDate,
        startTime,
        endTime,
        categoryId: result.categoryId,
        notes: result.notes,
        estimatedMinutes: duration,
      });
    } else {
      let duration = result.estimatedMinutes;
      if (!duration && result.startTime && result.endTime) {
        duration = diffMinutes(result.startTime, result.endTime);
      }
      if (!duration || duration <= 0) {
        duration = 60;
      }

      const timePart = result.startTime || "09:00";
      const dueDate = result.eventDate ? `${result.eventDate}T${timePart}:00` : null;

      setResult({
        type: "task",
        title: result.title,
        estimatedMinutes: duration,
        isUrgent: false,
        isImportant: true,
        dueDate,
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
    rawText,
    status,
    isReporting,
    error,
    parseText,
    reportError,
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

function diffMinutes(startTime: string, endTime: string): number {
  const [h1, m1] = startTime.split(":").map(Number);
  const [h2, m2] = endTime.split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 60;
  const startMins = h1 * 60 + m1;
  const endMins = h2 * 60 + m2;
  const diff = endMins - startMins;
  return diff > 0 ? diff : diff + 1440;
}

