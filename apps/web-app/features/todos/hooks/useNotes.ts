"use client";

import { useCallback } from "react";
import { getApiErrorMessage } from "@/lib/fetchClient";
import {todoService} from "../services/todo.service";
import {useTodoStore} from "../stores/todo.store";

export function useNotes() {
  const notes = useTodoStore((s) => s.notes);
  const loading = useTodoStore((s) => s.loading);
  const error = useTodoStore((s) => s.error);

  const setNotes = useTodoStore((s) => s.setNotes);
  const setLoading = useTodoStore((s) => s.setLoading);
  const setError = useTodoStore((s) => s.setError);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const notesValue = await todoService.getNotes();
      setNotes(notesValue);
      return notesValue;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to fetch notes");
      console.error("Error fetching notes:", error);
      setError(message);
      return "";
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setNotes]);

  const updateNotes = useCallback(
    async (newNotes: string) => {
      setNotes(newNotes);
      setError(null);

      try {
        await todoService.updateNotes(newNotes);
        return true;
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to update notes");
        console.error("Error updating notes:", error);
        setError(message);
        return false;
      }
    },
    [setError, setNotes],
  );

  return {
    notes,
    loading,
    error,
    fetchNotes,
    updateNotes,
  };
}


