"use client";

import React, { useEffect } from "react";
import { useStickyNotesQuery } from "../hooks/useStickyNotes";
import { StickyNoteItem } from "./StickyNoteItem";
import { useStickyNotesStore } from "../store/sticky-notes.store";

export function StickyNotesOverlay() {
  const { data: notes = [] } = useStickyNotesQuery();
  const syncMaxZIndex = useStickyNotesStore((s) => s.syncMaxZIndex);

  useEffect(() => {
    syncMaxZIndex(notes);
  }, [notes, syncMaxZIndex]);

  const visibleNotes = notes.filter((n) => n.isVisible !== false);

  if (visibleNotes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {visibleNotes.map((note) => (
        <StickyNoteItem key={note.id} note={note} />
      ))}
    </div>
  );
}
