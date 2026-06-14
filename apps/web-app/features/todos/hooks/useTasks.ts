"use client";

import { useCallback } from "react";
import { appToast } from "@/components/feedback/app-toast";
import { getApiErrorMessage } from "@/lib/fetchClient";
import {BoardTask, CreateTaskInput, TaskStatus, UpdateTaskInput} from "../types/todo.type";
import {todoService} from "../services/todo.service";
import {useTodoStore} from "../stores/todo.store";

export function useTasks() {
  const tasks = useTodoStore((s) => s.tasks);
  const loading = useTodoStore((s) => s.loading);
  const error = useTodoStore((s) => s.error);

  const setTasks = useTodoStore((s) => s.setTasks);
  const setLoading = useTodoStore((s) => s.setLoading);
  const setError = useTodoStore((s) => s.setError);

  const syncTasks = useCallback(async () => {
    const latest = await todoService.getTasks();
    setTasks(latest);
    return latest;
  }, [setTasks]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      return await syncTasks();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to fetch tasks");
      console.error("Error fetching tasks:", error);
      setError(message);
      return [] as BoardTask[];
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, syncTasks]);

  const createTask = useCallback(
    async (taskData: CreateTaskInput) => {
      const previousTasks = useTodoStore.getState().tasks;
      setLoading(true);
      setError(null);

      try {
        const created = await todoService.createTask(taskData);
        try {
          await syncTasks();
        } catch (syncError) {
          console.error("Error refreshing tasks after create:", syncError);
          setTasks([...previousTasks, created]);
        }
        appToast.success("Task created", {
          description: `"${taskData.title}" has been added.`,
        });
        return created;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to create task");
        console.error("Error creating task:", error);
        setError(message);
        appToast.error("Task creation failed", {
          description: message,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setTasks, syncTasks],
  );

  const updateTaskStatus = useCallback(
    async (id: number, status: TaskStatus) => {
      const originalTasks = useTodoStore.getState().tasks;
      const optimisticTasks = originalTasks.map((task) =>
        task.id === id ? { ...task, status, isDone: status === "DONE" } : task,
      );

      setTasks(optimisticTasks);
      setError(null);

      try {
        await todoService.updateTask(id, {
          status,
          isDone: status === "DONE",
        });
        try {
          await syncTasks();
        } catch (syncError) {
          console.error("Error refreshing tasks after status update:", syncError);
        }
        return true;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to update task status");
        console.error("Error updating task status:", error);
        setTasks(originalTasks);
        setError(message);
        appToast.error("Update failed", {
          description: message,
        });
        return false;
      }
    },
    [setError, setTasks, syncTasks],
  );

  const toggleTaskDone = useCallback(
    async (id: number, isDone: boolean) => {
      const originalTasks = useTodoStore.getState().tasks;
      const optimisticTasks = originalTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              isDone,
              status: (isDone ? "DONE" : task.status === "DONE" ? "TODO" : task.status) as TaskStatus,
            }
          : task,
      );

      setTasks(optimisticTasks);
      setError(null);

      try {
        await todoService.updateTask(id, {
          isDone,
          status: isDone ? "DONE" : "TODO",
        });
        try {
          await syncTasks();
        } catch (syncError) {
          console.error("Error refreshing tasks after toggle:", syncError);
        }
        return true;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to toggle task");
        console.error("Error toggling task done:", error);
        setTasks(originalTasks);
        setError(message);
        appToast.error("Update failed", {
          description: message,
        });
        return false;
      }
    },
    [setError, setTasks, syncTasks],
  );

  const updateTask = useCallback(
    async (id: number, data: UpdateTaskInput) => {
      const originalTasks = useTodoStore.getState().tasks;
      setLoading(true);
      setError(null);

      const optimisticTasks = originalTasks.map((task) =>
        task.id === id ? { ...task, ...data } : task,
      );
      setTasks(optimisticTasks);

      try {
        await todoService.updateTask(id, data);
        try {
          await syncTasks();
        } catch (syncError) {
          console.error("Error refreshing tasks after update:", syncError);
        }
        appToast.success("Task updated", {
          description: `"${data.title ?? "Task"}" has been saved.`,
        });
        return true;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to update task");
        console.error("Error updating task:", error);
        setTasks(originalTasks);
        setError(message);
        appToast.error("Update failed", {
          description: message,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setTasks, syncTasks],
  );

  const updateTaskTitle = useCallback(
    async (id: number, title: string) => {
      const originalTasks = useTodoStore.getState().tasks;
      const optimisticTasks = originalTasks.map((task) =>
        task.id === id ? { ...task, title } : task,
      );

      setTasks(optimisticTasks);
      setError(null);

      try {
        await todoService.updateTask(id, { title });
        try {
          await syncTasks();
        } catch (syncError) {
          console.error("Error refreshing tasks after title update:", syncError);
        }
        return true;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to update title");
        console.error("Error updating task title:", error);
        setTasks(originalTasks);
        setError(message);
        appToast.error("Save failed", {
          description: message,
        });
        return false;
      }
    },
    [setError, setTasks, syncTasks],
  );

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTaskStatus,
    toggleTaskDone,
    updateTask,
    updateTaskTitle,
  };
}


