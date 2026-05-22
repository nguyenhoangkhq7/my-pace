"use client";

import { useCallback } from "react";
import { appToast } from "@/components/feedback/app-toast";
import { getApiErrorMessage } from "@/lib/fetchClient";
import {Category, CreateCategoryInput} from "../types/todo.type";
import {todoService} from "../services/todo.service";
import {useTodoStore} from "../stores/todo.store";

export function useCategories() {
  const categories = useTodoStore((s) => s.categories);
  const loading = useTodoStore((s) => s.loading);
  const error = useTodoStore((s) => s.error);

  const setCategories = useTodoStore((s) => s.setCategories);
  const setLoading = useTodoStore((s) => s.setLoading);
  const setError = useTodoStore((s) => s.setError);

  const syncCategories = useCallback(async () => {
    const latest = await todoService.getCategories();
    setCategories(latest);
    return latest;
  }, [setCategories]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      return await syncCategories();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to fetch categories");
      console.error("Error fetching categories:", error);
      setError(message);
      return [] as Category[];
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, syncCategories]);

  const createCategory = useCallback(
    async (name: string, preferredStartTime?: string, preferredEndTime?: string) => {
      const previousCategories = useTodoStore.getState().categories;
      setLoading(true);
      setError(null);

      const payload: CreateCategoryInput = {
        name,
        preferredStartTime: preferredStartTime || null,
        preferredEndTime: preferredEndTime || null,
      };

      try {
        const created = await todoService.createCategory(payload);
        try {
          await syncCategories();
        } catch (syncError) {
          console.error("Error refreshing categories after create:", syncError);
          setCategories([...previousCategories, created]);
        }
        appToast.success("Category created", {
          description: `"${name}" has been added.`,
        });
        return created;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to create category");
        console.error("Error creating category:", error);
        setError(message);
        appToast.error("Category creation failed", {
          description: message,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setCategories, setError, setLoading, syncCategories],
  );

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
  };
}


