"use client";

import React, { useState } from "react";
import type { StickyNoteColor } from "../types";
import { STICKY_NOTE_THEMES } from "../utils/color-palettes";
import { Plus, MoreVertical, List, Palette, Pin, PinOff, X, Trash2, Tv, Check } from "lucide-react";
import { useStickyNotesStore } from "../store/sticky-notes.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";

interface StickyNoteHeaderProps {
  title: string;
  color: StickyNoteColor;
  isPinned: boolean;
  isMaximized?: boolean;
  isPresenting?: boolean;
  presentationWidget?: React.ReactNode;
  onAddNewNote?: () => void;
  onTitleChange: (title: string) => void;
  onColorChange: (color: StickyNoteColor) => void;
  onTogglePin: () => void;
  onToggleMaximize?: () => void;
  onTogglePresentation?: () => void;
  onHide: () => void;
  onDelete: () => void;
  onPointerDownDrag: (e: React.PointerEvent) => void;
}

export function StickyNoteHeader({
  title,
  color,
  isPinned,
  isPresenting,
  presentationWidget,
  onAddNewNote,
  onTitleChange,
  onColorChange,
  onTogglePin,
  onToggleMaximize,
  onTogglePresentation,
  onHide,
  onDelete,
  onPointerDownDrag,
}: StickyNoteHeaderProps) {
  const { t } = useTranslation();
  const toggleManagerOpen = useStickyNotesStore((s) => s.toggleManagerOpen);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  const COLOR_CONFIGS: { key: StickyNoteColor; name: string }[] = [
    { key: "amber", name: t.stickyNotes.colorAmber },
    { key: "emerald", name: t.stickyNotes.colorEmerald },
    { key: "indigo", name: t.stickyNotes.colorIndigo },
    { key: "rose", name: t.stickyNotes.colorRose },
    { key: "violet", name: t.stickyNotes.colorViolet },
    { key: "dark", name: t.stickyNotes.colorDark },
  ];

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle.trim() !== title) {
      onTitleChange(localTitle.trim() || t.stickyNotes.untitled);
    }
  };

  const theme = STICKY_NOTE_THEMES[color] || STICKY_NOTE_THEMES.amber;

  return (
    <div
      onPointerDown={onPointerDownDrag}
      onDoubleClick={onToggleMaximize}
      title={t.stickyNotes.doubleClickToMaximize}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-grab active:cursor-grabbing select-none text-current border-b ${theme.headerBorder}`}
    >
      {/* Color dot */}
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.dot}`} />

      {/* Quick add (+) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAddNewNote?.(); }}
        onPointerDown={(e) => e.stopPropagation()}
        title={t.stickyNotes.newNote}
        className="p-0.5 rounded opacity-70 hover:opacity-100 transition-all cursor-pointer text-current shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Title */}
      <div className="shrink min-w-0 max-w-[35%] overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
        {isEditingTitle ? (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleBlur();
              if (e.key === "Escape") { setIsEditingTitle(false); setLocalTitle(title); }
            }}
            autoFocus
            size={Math.max(4, localTitle.length + 1)}
            className="text-xs font-semibold text-current bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded outline-none border border-current/20 max-w-full"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            title={t.stickyNotes.doubleClickToRename}
            className="text-xs font-semibold text-current/80 truncate block cursor-text select-none hover:underline"
          >
            {title || t.stickyNotes.untitled}
            {isPinned && <span className="ml-1 text-amber-500">📌</span>}
          </span>
        )}
      </div>

      {/* Perfectly Centered Spotlight Presentation Widget */}
      <div className="flex-1 flex items-center justify-center mx-1 min-w-0" onPointerDown={(e) => e.stopPropagation()}>
        {isPresenting && presentationWidget}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-0.5 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* Close / Hide */}
        <button
          type="button"
          onClick={onHide}
          title={t.stickyNotes.hide}
          className="p-1 rounded hover:bg-black/15 dark:hover:bg-white/15 opacity-70 hover:opacity-100 transition-colors cursor-pointer text-current"
        >
          <X className="w-3 h-3" />
        </button>

        {/* 3-Dots Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={t.stickyNotes.options}
              className="p-1 rounded hover:bg-black/15 dark:hover:bg-white/15 opacity-70 hover:opacity-100 transition-colors cursor-pointer text-current"
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-1 min-w-[180px] bg-card border-border shadow-2xl z-[9999]">
            <DropdownMenuItem onSelect={onTogglePresentation} className="flex items-center gap-2 text-xs cursor-pointer">
              <Tv className={`w-3.5 h-3.5 ${isPresenting ? "text-amber-400" : "text-primary"}`} />
              <span className={isPresenting ? "font-bold text-amber-500" : ""}>
                {isPresenting ? t.stickyNotes.turnOffPresentation : t.stickyNotes.presentationMode}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={toggleManagerOpen} className="flex items-center gap-2 text-xs cursor-pointer">
              <List className="w-3.5 h-3.5 text-primary" />
              <span>{t.stickyNotes.title}</span>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 text-xs cursor-pointer">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.stickyNotes.changeColor}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1.5 min-w-[130px] bg-card border-border shadow-2xl">
                {COLOR_CONFIGS.map((c) => {
                  const isSelected = color === c.key;
                  const itemTheme = STICKY_NOTE_THEMES[c.key];
                  return (
                    <DropdownMenuItem
                      key={c.key}
                      onSelect={() => onColorChange(c.key)}
                      className={`flex items-center gap-2 text-xs cursor-pointer py-1.5 px-2 rounded-md ${
                        isSelected ? "bg-primary/15 text-primary font-bold" : ""
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${itemTheme.dot} shrink-0 ${isSelected ? "ring-2 ring-primary ring-offset-1 scale-110" : ""}`} />
                      <span>{c.name}</span>
                      {isSelected && <Check className="ml-auto w-3.5 h-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onSelect={onTogglePin} className="flex items-center gap-2 text-xs cursor-pointer">
              {isPinned ? <PinOff className="w-3.5 h-3.5 text-amber-500" /> : <Pin className="w-3.5 h-3.5" />}
              <span>{isPinned ? t.stickyNotes.unpin : t.stickyNotes.pin}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={onDelete} className="flex items-center gap-2 text-xs text-red-500 focus:text-red-600 focus:bg-red-500/10 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.stickyNotes.delete}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
