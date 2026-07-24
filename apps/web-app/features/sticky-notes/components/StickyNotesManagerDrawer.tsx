"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyNote, StickyNoteColor } from "../types";
import { useStickyNotesStore } from "../store/sticky-notes.store";
import {
  useStickyNotesQuery,
  useCreateStickyNoteMutation,
  useUpdateStickyNoteMutation,
  useDeleteStickyNoteMutation,
} from "../hooks/useStickyNotes";
import { STICKY_NOTE_THEMES } from "../utils/color-palettes";
import {
  Search,
  Plus,
  Pin,
  PinOff,
  Trash2,
  StickyNote as NoteIcon,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const COLOR_FILTERS: { key: StickyNoteColor | "all"; name: string; dot: string }[] = [
  { key: "all", name: "Tất cả", dot: "bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-400" },
  { key: "amber", name: "Vàng Amber", dot: "bg-amber-400" },
  { key: "emerald", name: "Xanh Emerald", dot: "bg-emerald-400" },
  { key: "indigo", name: "Xanh Indigo", dot: "bg-indigo-400" },
  { key: "rose", name: "Hồng Rose", dot: "bg-rose-400" },
  { key: "violet", name: "Tím Violet", dot: "bg-violet-400" },
  { key: "dark", name: "Tối Dark", dot: "bg-slate-600" },
];

export function StickyNotesManagerDrawer() {
  const { t } = useTranslation();
  const {
    isManagerOpen,
    setIsManagerOpen,
    searchQuery,
    setSearchQuery,
    selectedColorFilter,
    setSelectedColorFilter,
    incrementMaxZIndex,
  } = useStickyNotesStore();

  const { data: notes = [] } = useStickyNotesQuery();
  const createMutation = useCreateStickyNoteMutation();
  const updateMutation = useUpdateStickyNoteMutation();
  const deleteMutation = useDeleteStickyNoteMutation();

  const [noteToDelete, setNoteToDelete] = useState<StickyNote | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredNotes = notes
    .filter((n) => {
      const matchesColor = selectedColorFilter === "all" || n.color === selectedColorFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q));
      return matchesColor && matchesSearch;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleCreateNew = () => {
    const count = notes.length;
    createMutation.mutate({
      title: t.stickyNotes.untitled,
      content: "",
      color: selectedColorFilter !== "all" ? selectedColorFilter : "amber",
      isVisible: true,
      positionX: 120 + (count % 5) * 30,
      positionY: 120 + (count % 5) * 30,
      zIndex: incrementMaxZIndex(),
    });
  };

  const handleToggleVisible = (note: StickyNote) => {
    const nextVisible = !note.isVisible;
    updateMutation.mutate({
      id: note.id,
      data: { isVisible: nextVisible, zIndex: nextVisible ? incrementMaxZIndex() : note.zIndex },
    });
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteMutation.mutate(noteToDelete.id);
      setNoteToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
        <DialogContent className="w-full sm:max-w-3xl max-h-[85vh] bg-card text-card-foreground border border-border/80 p-0 flex flex-col rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header section with aura gradient */}
          <div className="relative px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent space-y-4">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-base font-bold flex items-center gap-3 text-foreground">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <NoteIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight">{t.stickyNotes.title}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {notes.length}
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-muted-foreground">Quản lý & sắp xếp tất cả các ghi chú của bạn</p>
                </div>
              </DialogTitle>

              <div className="flex items-center gap-2.5">
                {/* View Mode Toggle */}
                <div className="flex items-center p-1 rounded-xl bg-muted/80 border border-border/60 text-muted-foreground shadow-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Grid View"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === "grid" ? "bg-background text-foreground shadow-sm font-bold scale-105" : "hover:text-foreground opacity-70"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="List View"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === "list" ? "bg-background text-foreground shadow-sm font-bold scale-105" : "hover:text-foreground opacity-70"
                    }`}
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary New Note Button */}
                <Button
                  size="sm"
                  onClick={handleCreateNew}
                  disabled={createMutation.isPending}
                  className="h-9 px-4 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  {t.stickyNotes.newNote}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.stickyNotes.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background/80 border-border/80 rounded-2xl focus-visible:ring-2 focus-visible:ring-amber-500/40 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Color Filter Tabs (No scrollbar) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {COLOR_FILTERS.map((f) => {
                const isSelected = selectedColorFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSelectedColorFilter(f.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                      isSelected
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-xs font-bold scale-105"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${f.dot} shrink-0 ${isSelected ? "ring-2 ring-amber-500/50" : ""}`} />
                    <span>{f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note List / Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 min-h-[340px] [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {filteredNotes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs gap-3.5 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-8 h-8 opacity-60" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm text-foreground">{t.stickyNotes.noNotesFound}</p>
                  <p className="text-xs text-muted-foreground">Tạo ghi chú mới hoặc thay đổi từ khóa tìm kiếm</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleCreateNew}
                  className="text-xs rounded-xl px-4 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  {t.stickyNotes.createFirstNote}
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredNotes.map((note) => (
                  <GridNoteCardItem
                    key={note.id}
                    note={note}
                    onToggleVisible={() => handleToggleVisible(note)}
                    onTogglePin={() => updateMutation.mutate({ id: note.id, data: { isPinned: !note.isPinned } })}
                    onRequestDelete={() => setNoteToDelete(note)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <ListNoteCardItem
                    key={note.id}
                    note={note}
                    onToggleVisible={() => handleToggleVisible(note)}
                    onTogglePin={() => updateMutation.mutate({ id: note.id, data: { isPinned: !note.isPinned } })}
                    onRequestDelete={() => setNoteToDelete(note)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hidden description for a11y */}
          <DialogDescription className="sr-only">{t.stickyNotes.description}</DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-card text-card-foreground border-border p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="flex flex-col items-center text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold">{t.stickyNotes.confirmDeleteTitle}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t.stickyNotes.confirmDeleteDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setNoteToDelete(null)} className="rounded-xl text-xs px-4">
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs px-4 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getCleanSnippet(content: string | undefined): string {
  if (!content) return "";
  return content
    .replace(/<div[^>]*>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

function GridNoteCardItem({
  note,
  onToggleVisible,
  onTogglePin,
  onRequestDelete,
}: {
  note: StickyNote;
  onToggleVisible: () => void;
  onTogglePin: () => void;
  onRequestDelete: () => void;
}) {
  const { t } = useTranslation();
  const isVisible = note.isVisible !== false;
  const cleanSnippet = getCleanSnippet(note.content);
  const theme = STICKY_NOTE_THEMES[note.color || "amber"] || STICKY_NOTE_THEMES.amber;

  return (
    <div
      onClick={onToggleVisible}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 ${theme.container} ${
        !isVisible ? "opacity-50 saturate-50 hover:opacity-80" : ""
      }`}
    >
      <div>
        {/* Header inside mini note card */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-3 h-3 rounded-full shrink-0 ${theme.dot} shadow-xs`} />
            <h4 className="text-xs font-bold text-current truncate">
              {note.title || t.stickyNotes.untitled}
            </h4>
            {note.isPinned && <span className="text-amber-500 text-xs shrink-0">📌</span>}
          </div>

          {/* Visibility status badge */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border transition-colors ${
              isVisible
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30"
            }`}
          >
            {isVisible ? "Hiển thị" : "Đã ẩn"}
          </span>
        </div>

        {/* Content Snippet Preview */}
        <div className="min-h-[54px] mb-3">
          <p className="text-xs text-current/80 line-clamp-3 leading-relaxed whitespace-pre-wrap font-medium">
            {cleanSnippet || <span className="italic opacity-50">{t.stickyNotes.writePlaceholder}</span>}
          </p>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-current/15 text-current/70">
        <span className="text-[10px] font-semibold opacity-70">
          {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString("vi-VN") : ""}
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onToggleVisible}
            title={isVisible ? t.stickyNotes.hide : t.stickyNotes.show}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-current transition-colors cursor-pointer"
          >
            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onTogglePin}
            title={note.isPinned ? t.stickyNotes.unpin : t.stickyNotes.pin}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              note.isPinned ? "text-amber-500 hover:bg-amber-500/15" : "text-current hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRequestDelete}
            title={t.stickyNotes.delete}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListNoteCardItem({
  note,
  onToggleVisible,
  onTogglePin,
  onRequestDelete,
}: {
  note: StickyNote;
  onToggleVisible: () => void;
  onTogglePin: () => void;
  onRequestDelete: () => void;
}) {
  const { t } = useTranslation();
  const isVisible = note.isVisible !== false;
  const cleanSnippet = getCleanSnippet(note.content);
  const theme = STICKY_NOTE_THEMES[note.color || "amber"] || STICKY_NOTE_THEMES.amber;

  return (
    <div
      onClick={onToggleVisible}
      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer group shadow-xs hover:shadow-md hover:-translate-y-0.5 ${theme.container} ${
        !isVisible ? "opacity-50 saturate-50 hover:opacity-80" : ""
      }`}
    >
      <span className={`w-3 h-3 rounded-full shrink-0 ${theme.dot} shadow-xs`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-current truncate">
            {note.title || t.stickyNotes.untitled}
          </span>
          {note.isPinned && <span className="text-amber-500 text-xs">📌</span>}
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              isVisible
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30"
            }`}
          >
            {isVisible ? "Hiển thị" : "Đã ẩn"}
          </span>
        </div>
        {cleanSnippet && (
          <p className="text-xs text-current/80 truncate font-medium">
            {cleanSnippet}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onToggleVisible}
          title={isVisible ? t.stickyNotes.hide : t.stickyNotes.show}
          className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-current transition-colors cursor-pointer"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onTogglePin}
          title={note.isPinned ? t.stickyNotes.unpin : t.stickyNotes.pin}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            note.isPinned ? "text-amber-500 hover:bg-amber-500/15" : "text-current hover:bg-black/10 dark:hover:bg-white/10"
          }`}
        >
          {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onRequestDelete}
          title={t.stickyNotes.delete}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
