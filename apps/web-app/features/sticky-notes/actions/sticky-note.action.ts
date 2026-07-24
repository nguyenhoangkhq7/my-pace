"use server";

import { serverFetch } from "@/lib/server-fetchClient";
import type { StickyNote, CreateStickyNotePayload, UpdateStickyNotePayload } from "../types";

export async function getStickyNotesAction() {
  return await serverFetch<StickyNote[]>("sticky-notes");
}

export async function createStickyNoteAction(data: CreateStickyNotePayload) {
  return await serverFetch<StickyNote>("sticky-notes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStickyNoteAction(id: string, data: UpdateStickyNotePayload) {
  return await serverFetch<StickyNote>(`sticky-notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteStickyNoteAction(id: string) {
  return await serverFetch<void>(`sticky-notes/${id}`, {
    method: "DELETE",
  });
}
