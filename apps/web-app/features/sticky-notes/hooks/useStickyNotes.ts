import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { StickyNote, CreateStickyNotePayload, UpdateStickyNotePayload } from "../types";
import { useAuthStore } from "@/features/auth";
import { toast } from "sonner";

export function useStickyNotesQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["stickyNotes"],
    queryFn: () => fetchClient.get<StickyNote[]>("sticky-notes").then(r => r.data),
    enabled: !!user,
  });
}

export function useCreateStickyNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStickyNotePayload) => fetchClient.post<StickyNote>("sticky-notes", data).then(r => r.data),
    onSuccess: (newNote) => {
      queryClient.setQueryData<StickyNote[]>(["stickyNotes"], (old = []) => [newNote, ...old]);
      queryClient.invalidateQueries({ queryKey: ["stickyNotes"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      toast.error(message || "Không thể tạo ghi chú mới");
    },
  });
}

export function useUpdateStickyNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStickyNotePayload }) =>
      fetchClient.put<StickyNote>(`sticky-notes/${id}`, data).then(r => r.data),
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
    onError: (err: unknown, _variables, context) => {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      toast.error(message || "Không thể cập nhật ghi chú");
      if (context?.previousNotes) {
        queryClient.setQueryData(["stickyNotes"], context.previousNotes);
      }
    },
  });
}

export function useDeleteStickyNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchClient.del<void>(`sticky-notes/${id}`).then(r => r.data),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["stickyNotes"] });
      const previousNotes = queryClient.getQueryData<StickyNote[]>(["stickyNotes"]);

      queryClient.setQueryData<StickyNote[]>(["stickyNotes"], (old = []) =>
        old.filter((note) => note.id !== id)
      );

      return { previousNotes };
    },
    onError: (err: unknown, _id, context) => {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      toast.error(message || "Không thể xóa ghi chú");
      if (context?.previousNotes) {
        queryClient.setQueryData(["stickyNotes"], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stickyNotes"] });
    },
  });
}
