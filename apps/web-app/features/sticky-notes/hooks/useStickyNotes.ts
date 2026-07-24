import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStickyNotesAction,
  createStickyNoteAction,
  updateStickyNoteAction,
  deleteStickyNoteAction,
} from "../actions/sticky-note.action";
import type { StickyNote, CreateStickyNotePayload, UpdateStickyNotePayload } from "../types";
import { useAuthStore } from "@/features/auth";
import { toast } from "sonner";

export function useStickyNotesQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["stickyNotes"],
    queryFn: getStickyNotesAction,
    enabled: !!user,
  });
}

export function useCreateStickyNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStickyNotePayload) => createStickyNoteAction(data),
    onSuccess: (newNote) => {
      queryClient.setQueryData<StickyNote[]>(["stickyNotes"], (old = []) => [newNote, ...old]);
      queryClient.invalidateQueries({ queryKey: ["stickyNotes"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể tạo ghi chú mới");
    },
  });
}

export function useUpdateStickyNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStickyNotePayload }) =>
      updateStickyNoteAction(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["stickyNotes"] });
      const previousNotes = queryClient.getQueryData<StickyNote[]>(["stickyNotes"]);

      queryClient.setQueryData<StickyNote[]>(["stickyNotes"], (old = []) =>
        old.map((note) => (note.id === id ? { ...note, ...data, updatedAt: new Date().toISOString() } : note))
      );

      return { previousNotes };
    },
    onSuccess: (updatedNote) => {
      if (updatedNote && updatedNote.id) {
        queryClient.setQueryData<StickyNote[]>(["stickyNotes"], (old = []) =>
          old.map((note) => (note.id === updatedNote.id ? { ...note, ...updatedNote } : note))
        );
      }
    },
    onError: (err: any, _variables, context) => {
      toast.error(err?.message || "Không thể cập nhật ghi chú");
      if (context?.previousNotes) {
        queryClient.setQueryData(["stickyNotes"], context.previousNotes);
      }
    },
  });
}

export function useDeleteStickyNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStickyNoteAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["stickyNotes"] });
      const previousNotes = queryClient.getQueryData<StickyNote[]>(["stickyNotes"]);

      queryClient.setQueryData<StickyNote[]>(["stickyNotes"], (old = []) =>
        old.filter((note) => note.id !== id)
      );

      return { previousNotes };
    },
    onError: (err: any, _id, context) => {
      toast.error(err?.message || "Không thể xóa ghi chú");
      if (context?.previousNotes) {
        queryClient.setQueryData(["stickyNotes"], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stickyNotes"] });
    },
  });
}
