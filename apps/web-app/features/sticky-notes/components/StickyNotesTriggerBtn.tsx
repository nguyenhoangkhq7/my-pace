"use client";

import React from "react";
import { StickyNote as NoteIcon } from "lucide-react";
import { useStickyNotesStore } from "../store/sticky-notes.store";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import {
  useStickyNotesQuery,
  useCreateStickyNoteMutation,
  useUpdateStickyNoteMutation,
} from "../hooks/useStickyNotes";

interface StickyNotesTriggerBtnProps {
  isCollapsed?: boolean;
}

export function StickyNotesTriggerBtn({ isCollapsed = false }: StickyNotesTriggerBtnProps) {
  const { t } = useTranslation();
  const { incrementMaxZIndex, toggleManagerOpen } = useStickyNotesStore();

  const { data: notes = [] } = useStickyNotesQuery();
  const createMutation = useCreateStickyNoteMutation();
  const updateMutation = useUpdateStickyNoteMutation();

  const count = notes.length;

  const handleClick = () => {
    if (notes.length === 0) {
      createMutation.mutate({
        title: t.stickyNotes.untitled,
        content: "",
        color: "amber",
        isVisible: true,
        positionX: 150,
        positionY: 150,
        zIndex: incrementMaxZIndex(),
      });
      return;
    }

    // Sort notes by updatedAt/createdAt descending to find the most recent note
    const sortedNotes = [...notes].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return (timeB - timeA) || (b.zIndex - a.zIndex);
    });
    const latestNote = sortedNotes[0];

    if (!latestNote.isVisible || latestNote.isMinimized) {
      // Unhide/restore only the most recent note
      updateMutation.mutate({
        id: latestNote.id,
        data: { isVisible: true, isMinimized: false, zIndex: incrementMaxZIndex() },
      });
    } else {
      // If the most recent note is already visible, toggle open the manager drawer
      toggleManagerOpen();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isCollapsed ? `${t.stickyNotes.triggerBtn}${count > 0 ? ` (${count})` : ""}` : t.stickyNotes.triggerBtn}
      className={cn(
        "w-full flex items-center rounded-xl transition-all cursor-pointer group text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/5",
        isCollapsed ? "justify-center py-2.5 px-0 relative" : "justify-between px-3 py-2"
      )}
    >
      <div className={cn("flex items-center", isCollapsed ? "justify-center relative" : "space-x-2.5")}>
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shrink-0">
          <NoteIcon className="w-3.5 h-3.5" />
        </div>
        {!isCollapsed && <span>{t.stickyNotes.triggerBtn}</span>}
        {isCollapsed && count > 0 && (
          <span className="absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded-full bg-amber-500 text-amber-950 font-bold text-[9px] flex items-center justify-center border border-sidebar shadow-xs">
            {count}
          </span>
        )}
      </div>

      {!isCollapsed && count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-[10px]">
          {count}
        </span>
      )}
    </button>
  );
}
