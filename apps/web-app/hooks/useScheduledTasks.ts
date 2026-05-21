"use client";

import { useCallback, useState } from "react";
import { appToast } from "@/components/feedback/app-toast";
import { getApiErrorMessage } from "@/lib/fetchClient";
import { todoService } from "@/services/todo.service";
import type { ScheduledTask } from "@/features/todos/types";

export function useScheduledTasks() {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchScheduledTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await todoService.getScheduledTasks();
      setScheduledTasks(data);
      return data;
    } catch (error) {
      console.error("Error fetching scheduled tasks:", error);
      return [] as ScheduledTask[];
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleTaskAction = useCallback(async (taskId: number, startTime: string, endTime: string) => {
    try {
      const result = await todoService.scheduleTask(taskId, startTime, endTime);
      setScheduledTasks((prev) => [...prev.filter((t) => t.taskId !== taskId), result]);
      appToast.success("Đã lên lịch tác vụ");
      return result;
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể lên lịch tác vụ");
      appToast.error(message);
      return null;
    }
  }, []);

  const updateScheduledAction = useCallback(async (id: number, startTime: string, endTime: string) => {
    try {
      const result = await todoService.updateScheduledTask(id, startTime, endTime);
      setScheduledTasks((prev) => prev.map((t) => (t.id === id ? result : t)));
      appToast.success("Đã cập nhật khung giờ");
      return result;
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể cập nhật khung giờ");
      appToast.error(message);
      return null;
    }
  }, []);

  const unscheduleTaskAction = useCallback(async (id: number) => {
    try {
      await todoService.unscheduleTask(id);
      setScheduledTasks((prev) => prev.filter((t) => t.id !== id));
      appToast.success("Đã gỡ tác vụ khỏi lịch");
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Không thể gỡ tác vụ");
      appToast.error(message);
      return false;
    }
  }, []);

  const autoScheduleAction = useCallback(async (taskId: number) => {
    try {
      const result = await todoService.autoScheduleTask(taskId);
      setScheduledTasks((prev) => [...prev.filter((t) => t.taskId !== taskId), result]);
      appToast.success("Đã tự động sắp xếp khung giờ trống");
      return result;
    } catch (error) {
      const message = getApiErrorMessage(error, "Không tìm thấy khung giờ phù hợp");
      appToast.error(message);
      return null;
    }
  }, []);

  return {
    scheduledTasks,
    loading,
    fetchScheduledTasks,
    scheduleTaskAction,
    updateScheduledAction,
    unscheduleTaskAction,
    autoScheduleAction,
  };
}

