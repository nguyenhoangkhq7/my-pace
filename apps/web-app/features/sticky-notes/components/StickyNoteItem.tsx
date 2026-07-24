"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { AlertTriangle, Highlighter, Sparkles, MousePointer, X, Check, Eraser, RotateCcw } from "lucide-react";
import type { StickyNote } from "../types";
import { STICKY_NOTE_THEMES } from "../utils/color-palettes";
import { EditorHistory } from "../utils/editor-history";
import { StickyNoteHeader } from "./StickyNoteHeader";
import { StickyNoteToolbar } from "./StickyNoteToolbar";
import { useStickyNotesStore } from "../store/sticky-notes.store";
import {
  useCreateStickyNoteMutation,
  useUpdateStickyNoteMutation,
  useDeleteStickyNoteMutation,
} from "../hooks/useStickyNotes";
import {
  applyHighlightToSelection,
  clearHighlightFromSelection,
  clearAllHighlightsFromEditor,
  applyVanishingHighlightToSelection,
  handleHighlightKeyDown,
  mergeAdjacentMarkTags,
} from "../utils/highlight-engine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface StickyNoteItemProps {
  note: StickyNote;
}

const MIN_WIDTH = 220;
const MIN_HEIGHT = 180;

function StickyNoteItemComponent({ note }: StickyNoteItemProps) {
  const { t } = useTranslation();
  const incrementMaxZIndex = useStickyNotesStore((s) => s.incrementMaxZIndex);
  const updateMutation = useUpdateStickyNoteMutation();
  const deleteMutation = useDeleteStickyNoteMutation();

  const PEN_COLORS = [
    { name: t.stickyNotes.colorAmber, color: "#fef08a", bg: "bg-yellow-300" },
    { name: t.stickyNotes.colorEmerald, color: "#bbf7d0", bg: "bg-emerald-300" },
    { name: t.stickyNotes.colorRose, color: "#fbcfe8", bg: "bg-pink-300" },
    { name: "Xanh ngọc", color: "#a5f3fc", bg: "bg-cyan-300" },
    { name: "Cam neon", color: "#fed7aa", bg: "bg-orange-300" },
  ];

  const getClampedPos = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const maxX = Math.max(10, window.innerWidth - (note.width || MIN_WIDTH) - 20);
    const maxY = Math.max(10, window.innerHeight - (note.height || MIN_HEIGHT) - 20);
    return {
      x: Math.min(Math.max(10, x), maxX),
      y: Math.min(Math.max(10, y), maxY),
    };
  };

  const initialClamped = getClampedPos(note.positionX, note.positionY);
  const [position, setPosition] = useState(initialClamped);
  const [size, setSize] = useState({ w: note.width || 280, h: note.height || 260 });
  const [zIndex, setZIndex] = useState(note.zIndex || 1);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [isFocusedState, setIsFocusedState] = useState(false);
  const [activePen, setActivePen] = useState<"permanent" | "vanishing" | "eraser" | "none">("permanent");
  const [activePenColor, setActivePenColor] = useState("#fef08a");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(initialClamped);
  const sizeRef = useRef({ w: note.width || 280, h: note.height || 260 });
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<EditorHistory | null>(null);

  if (!historyRef.current) {
    historyRef.current = new EditorHistory(note.content || "");
  }

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, width: 0, height: 0 });

  const bringToFront = useCallback(() => {
    const nextZ = incrementMaxZIndex();
    setZIndex(nextZ);
  }, [incrementMaxZIndex]);

  useEffect(() => {
    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInsideCard = containerRef.current && containerRef.current.contains(target);
      const isInsidePortal = !!target.closest(
        "[data-radix-popper-content-wrapper], [role='menu'], [role='dialog'], [data-state='open']"
      );

      if (isInsideCard || isInsidePortal) {
        setIsFocusedState(true);
      } else {
        setIsFocusedState(false);
      }
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
    };
  }, []);

  const initialNoteIdRef = useRef<string | null>(null);
  const lastSyncedContentRef = useRef<string>(note.content || "");

  useEffect(() => {
    if (!editorRef.current) return;

    if (initialNoteIdRef.current !== note.id) {
      editorRef.current.innerHTML = note.content || "";
      mergeAdjacentMarkTags(editorRef.current);
      historyRef.current?.reset(editorRef.current.innerHTML);
      initialNoteIdRef.current = note.id;
      lastSyncedContentRef.current = note.content || "";
      return;
    }

    if (note.content !== lastSyncedContentRef.current) {
      lastSyncedContentRef.current = note.content || "";
      const isEditingThisNote =
        document.activeElement === editorRef.current ||
        (containerRef.current && containerRef.current.contains(document.activeElement));

      if (!isEditingThisNote) {
        editorRef.current.innerHTML = note.content || "";
        mergeAdjacentMarkTags(editorRef.current);
        historyRef.current?.reset(editorRef.current.innerHTML);
      }
    }
  }, [note.id, note.content]);

  const handleContentInput = useCallback(() => {
    if (!editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;

    historyRef.current?.push(newHtml);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate({ id: note.id, data: { content: newHtml } });
    }, 600);
  }, [note.id, updateMutation]);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          const nextHtml = historyRef.current?.redo();
          if (nextHtml !== null && nextHtml !== undefined && editorRef.current) {
            editorRef.current.innerHTML = nextHtml;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
              updateMutation.mutate({ id: note.id, data: { content: nextHtml } });
            }, 600);
          }
        } else {
          const prevHtml = historyRef.current?.undo();
          if (prevHtml !== null && prevHtml !== undefined && editorRef.current) {
            editorRef.current.innerHTML = prevHtml;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
              updateMutation.mutate({ id: note.id, data: { content: prevHtml } });
            }, 600);
          }
        }
        return;
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        const nextHtml = historyRef.current?.redo();
        if (nextHtml !== null && nextHtml !== undefined && editorRef.current) {
          editorRef.current.innerHTML = nextHtml;
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            updateMutation.mutate({ id: note.id, data: { content: nextHtml } });
          }, 600);
        }
        return;
      }
    }

    if (editorRef.current && handleHighlightKeyDown(e, editorRef.current)) {
      handleContentInput();
    }
  };

  const handleTogglePresentation = () => {
    if (!isPresenting) {
      setIsPresenting(true);
    } else {
      handleExitPresentation();
    }
  };

  const handleExitPresentation = () => {
    handleContentInput();
    setIsPresenting(false);
  };

  const handleClearAllHighlightsLive = () => {
    if (!editorRef.current) return;
    clearAllHighlightsFromEditor(editorRef.current);
    handleContentInput();
  };

  // Ultra 120FPS GPU-Accelerated Drag Handler
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    bringToFront();
    isDraggingRef.current = true;
    setIsDraggingState(true);

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch (_err) { /* ignore */ }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
      width: sizeRef.current.w,
      height: sizeRef.current.h,
    };

    if (containerRef.current) {
      containerRef.current.style.transition = "none";
      containerRef.current.style.willChange = "transform";
      containerRef.current.style.backdropFilter = "none";
    }
    if (editorRef.current) {
      editorRef.current.style.pointerEvents = "none";
    }
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    let rafId: number | null = null;
    let latestDx = 0;
    let latestDy = 0;

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!isDraggingRef.current) return;
      latestDx = moveEv.clientX - dragStartRef.current.x;
      latestDy = moveEv.clientY - dragStartRef.current.y;

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!containerRef.current || !isDraggingRef.current) return;

        const maxAllowedX = window.innerWidth - dragStartRef.current.width - 10;
        const maxAllowedY = window.innerHeight - dragStartRef.current.height - 10;

        const rawX = dragStartRef.current.posX + latestDx;
        const rawY = dragStartRef.current.posY + latestDy;

        const clampedX = Math.max(10, Math.min(maxAllowedX, rawX));
        const clampedY = Math.max(10, Math.min(maxAllowedY, rawY));

        const transformX = clampedX - dragStartRef.current.posX;
        const transformY = clampedY - dragStartRef.current.posY;

        posRef.current = { x: clampedX, y: clampedY };
        containerRef.current.style.transform = `translate3d(${transformX}px, ${transformY}px, 0px)`;
      });
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDraggingState(false);

      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      try {
        targetEl.releasePointerCapture(upEv.pointerId);
      } catch (_err) { /* ignore */ }

      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      if (containerRef.current) {
        containerRef.current.style.willChange = "";
        containerRef.current.style.backdropFilter = "";
        containerRef.current.style.transform = "";
        containerRef.current.style.left = `${posRef.current.x}px`;
        containerRef.current.style.top = `${posRef.current.y}px`;
      }
      if (editorRef.current) {
        editorRef.current.style.pointerEvents = "";
      }

      setPosition(posRef.current);
      updateMutation.mutate({
        id: note.id,
        data: { positionX: posRef.current.x, positionY: posRef.current.y, zIndex },
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Ultra 120FPS GPU-Accelerated Resize Handler
  const handlePointerDownResize = (dir: "e" | "s" | "w" | "n" | "se" | "sw" | "ne" | "nw", e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    bringToFront();

    isResizingRef.current = true;
    setIsDraggingState(true);

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch (_err) { /* ignore */ }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
      width: sizeRef.current.w,
      height: sizeRef.current.h,
    };

    if (containerRef.current) {
      containerRef.current.style.transition = "none";
      containerRef.current.style.willChange = "width, height, left, top";
      containerRef.current.style.backdropFilter = "none";
    }
    if (editorRef.current) {
      editorRef.current.style.pointerEvents = "none";
    }
    document.body.style.userSelect = "none";

    let rafId: number | null = null;
    let latestDx = 0;
    let latestDy = 0;

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!isResizingRef.current) return;
      latestDx = moveEv.clientX - dragStartRef.current.x;
      latestDy = moveEv.clientY - dragStartRef.current.y;

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!containerRef.current || !isResizingRef.current) return;

        let newW = dragStartRef.current.width;
        let newH = dragStartRef.current.height;
        let newX = dragStartRef.current.posX;
        let newY = dragStartRef.current.posY;

        if (dir.includes("e")) {
          newW = Math.max(MIN_WIDTH, dragStartRef.current.width + latestDx);
        } else if (dir.includes("w")) {
          const possibleW = dragStartRef.current.width - latestDx;
          if (possibleW >= MIN_WIDTH) {
            newW = possibleW;
            newX = dragStartRef.current.posX + latestDx;
          } else {
            newW = MIN_WIDTH;
            newX = dragStartRef.current.posX + (dragStartRef.current.width - MIN_WIDTH);
          }
        }

        if (dir.includes("s")) {
          newH = Math.max(MIN_HEIGHT, dragStartRef.current.height + latestDy);
        } else if (dir.includes("n")) {
          const possibleH = dragStartRef.current.height - latestDy;
          if (possibleH >= MIN_HEIGHT) {
            newH = possibleH;
            newY = dragStartRef.current.posY + latestDy;
          } else {
            newH = MIN_HEIGHT;
            newY = dragStartRef.current.posY + (dragStartRef.current.height - MIN_HEIGHT);
          }
        }

        posRef.current = { x: newX, y: newY };
        sizeRef.current = { w: newW, h: newH };

        containerRef.current.style.left = `${newX}px`;
        containerRef.current.style.top = `${newY}px`;
        containerRef.current.style.width = `${newW}px`;
        containerRef.current.style.height = `${newH}px`;
      });
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      setIsDraggingState(false);

      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      try {
        targetEl.releasePointerCapture(upEv.pointerId);
      } catch (_err) { /* ignore */ }

      document.body.style.userSelect = "";

      if (containerRef.current) {
        containerRef.current.style.willChange = "";
        containerRef.current.style.backdropFilter = "";
      }
      if (editorRef.current) {
        editorRef.current.style.pointerEvents = "";
      }

      setPosition(posRef.current);
      setSize(sizeRef.current);
      updateMutation.mutate({
        id: note.id,
        data: {
          width: sizeRef.current.w,
          height: sizeRef.current.h,
          positionX: posRef.current.x,
          positionY: posRef.current.y,
        },
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const theme = STICKY_NOTE_THEMES[note.color || "amber"] || STICKY_NOTE_THEMES.amber;

  const [isMaximized, setIsMaximized] = useState(false);
  const preMaximizeRef = useRef<{ pos: { x: number; y: number }; size: { w: number; h: number } } | null>(null);

  const handleToggleMaximize = useCallback(() => {
    bringToFront();
    if (containerRef.current) {
      containerRef.current.style.transition = "left 0.2s ease-out, top 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out";
      setTimeout(() => {
        if (containerRef.current && !isDraggingRef.current && !isResizingRef.current) {
          containerRef.current.style.transition = "";
        }
      }, 250);
    }
    setIsMaximized((prev) => {
      if (!prev) {
        preMaximizeRef.current = { pos: { ...position }, size: { ...size } };
        return true;
      } else {
        if (preMaximizeRef.current) {
          setPosition(preMaximizeRef.current.pos);
          setSize(preMaximizeRef.current.size);
        }
        return false;
      }
    });
  }, [bringToFront, position, size]);

  const createMutation = useCreateStickyNoteMutation();

  const handleAddNewNote = () => {
    const nextZ = incrementMaxZIndex();
    createMutation.mutate({
      title: t.stickyNotes.untitled,
      content: "",
      color: note.color,
      isVisible: true,
      positionX: Math.min(window.innerWidth - 320, position.x + 35),
      positionY: Math.min(window.innerHeight - 300, position.y + 35),
      zIndex: nextZ,
    });
  };

  const handlePresentationMouseUp = () => {
    if (!isPresenting || activePen === "none" || !editorRef.current) return;

    if (activePen === "permanent") {
      const changed = applyHighlightToSelection(editorRef.current, activePenColor);
      if (changed) handleContentInput();
    } else if (activePen === "vanishing") {
      applyVanishingHighlightToSelection(editorRef.current);
    } else if (activePen === "eraser") {
      const changed = clearHighlightFromSelection(editorRef.current);
      if (changed) handleContentInput();
    }
  };

  const getCursorStyle = (): React.CSSProperties => {
    if (!isPresenting || activePen === "none") return {};
    if (activePen === "permanent") {
      return {
        cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23facc15' stroke='%23854d0e' stroke-width='2'%3E%3Cpath d='m9 11-6 6v3h3l6-6'/%3E%3Cpath d='m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'/%3E%3C/svg%3E") 0 22, pointer`,
      };
    } else if (activePen === "vanishing") {
      return {
        cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23ec4899' stroke='%239d174d' stroke-width='2'%3E%3Cpath d='m9 11-6 6v3h3l6-6'/%3E%3Cpath d='m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'/%3E%3C/svg%3E") 0 22, pointer`,
      };
    } else if (activePen === "eraser") {
      return {
        cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23ef4444' stroke='%23991b1b' stroke-width='2'%3E%3Cpath d='m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l6.3 6.3a1 1 0 0 1 0 1.4l-6.3 6.3a1 1 0 0 1-1.4 0Z'/%3E%3Cpath d='m22 21-10 0'/%3E%3C/svg%3E") 0 22, pointer`,
      };
    }
    return {};
  };

  const spotlightWidget = isPresenting ? (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border border-amber-400/80 shadow-md backdrop-blur-2xl select-none animate-in fade-in duration-150">
      {/* Permanent Highlighter */}
      <button
        type="button"
        onClick={() => setActivePen("permanent")}
        title={t.stickyNotes.penTool}
        className={`p-1 rounded-full transition-all cursor-pointer ${
          activePen === "permanent"
            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50 scale-110 font-bold ring-2 ring-amber-500/60"
            : "opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      {/* Permanent Pen Color Selection Dots */}
      {activePen === "permanent" && (
        <div className="flex items-center gap-1 px-1 border-l border-slate-300 dark:border-slate-700 ml-0.5 animate-in fade-in duration-150">
          {PEN_COLORS.map((pc) => {
            const isSelected = activePenColor === pc.color;
            return (
              <button
                key={pc.name}
                type="button"
                onClick={() => setActivePenColor(pc.color)}
                title={pc.name}
                className={`w-3.5 h-3.5 rounded-full ${pc.bg} flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-slate-900 dark:ring-white scale-125 shadow-sm"
                    : "opacity-60 hover:opacity-100 hover:scale-110"
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Vanishing Glow Pen (3s) */}
      <button
        type="button"
        onClick={() => setActivePen("vanishing")}
        title={t.stickyNotes.vanishingPen}
        className={`p-1 rounded-full transition-all cursor-pointer ${
          activePen === "vanishing"
            ? "bg-pink-500 text-white shadow-md shadow-pink-500/50 scale-110 ring-2 ring-pink-400/60"
            : "opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
      </button>

      {/* Eraser */}
      <button
        type="button"
        onClick={() => setActivePen("eraser")}
        title={t.stickyNotes.eraser}
        className={`p-1 rounded-full transition-all cursor-pointer ${
          activePen === "eraser"
            ? "bg-red-500 text-white shadow-md shadow-red-500/50 scale-110 ring-2 ring-red-400/60"
            : "opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 text-red-500 dark:text-red-400"
        }`}
      >
        <Eraser className="w-3.5 h-3.5" />
      </button>

      {/* Normal Pointer */}
      <button
        type="button"
        onClick={() => setActivePen("none")}
        title={t.stickyNotes.pointer}
        className={`p-1 rounded-full transition-all cursor-pointer ${
          activePen === "none"
            ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold ring-1 ring-black/20 dark:ring-white/30"
            : "opacity-60 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        <MousePointer className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-0.5" />

      {/* Clear All Highlights */}
      <button
        type="button"
        onClick={handleClearAllHighlightsLive}
        title={t.stickyNotes.clearAllHighlights}
        className="p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Exit Spotlight */}
      <button
        type="button"
        onClick={handleExitPresentation}
        title={t.stickyNotes.exitPresentation}
        className="p-1 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all cursor-pointer opacity-80 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : null;

  return (
    <>
      {isPresenting && (
        <div
          onClick={handleExitPresentation}
          title="Click ra ngoài để thoát chế độ trình chiếu"
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-[9980] transition-opacity cursor-pointer animate-in fade-in duration-200"
        />
      )}

      <div
        ref={containerRef}
        onPointerDown={bringToFront}
        style={{
          left: isMaximized ? "16px" : `${position.x}px`,
          top: isMaximized ? "16px" : `${position.y}px`,
          width: isMaximized ? "calc(100vw - 32px)" : `${size.w}px`,
          height: isMaximized ? "calc(100vh - 32px)" : `${size.h}px`,
          zIndex: isPresenting ? 9995 : (note.isPinned ? zIndex + 1000 : zIndex),
        }}
        className={`fixed border-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-shadow duration-200 group/card relative ${theme.container} ${
          isDraggingState ? "shadow-2xl opacity-95 backdrop-blur-none" : "backdrop-blur-md"
        } ${
          isPresenting
            ? "border-amber-400 dark:border-amber-400/90 shadow-2xl shadow-amber-500/45 ring-2 ring-amber-400/50 dark:ring-amber-400/40"
            : ""
        }`}
      >
        {/* Header */}
        <StickyNoteHeader
          title={note.title}
          color={note.color}
          isPinned={note.isPinned}
          isMaximized={isMaximized}
          isPresenting={isPresenting}
          presentationWidget={spotlightWidget}
          onAddNewNote={handleAddNewNote}
          onTitleChange={(t) => updateMutation.mutate({ id: note.id, data: { title: t } })}
          onColorChange={(c) => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            updateMutation.mutate({ id: note.id, data: { color: c } });
          }}
          onTogglePin={() => updateMutation.mutate({ id: note.id, data: { isPinned: !note.isPinned } })}
          onToggleMaximize={handleToggleMaximize}
          onTogglePresentation={handleTogglePresentation}
          onHide={() => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            updateMutation.mutate({ id: note.id, data: { isVisible: false } });
          }}
          onDelete={() => setIsConfirmDeleteOpen(true)}
          onPointerDownDrag={handlePointerDownDrag}
        />

        {/* Click/Focus-Activated Edit Toolbar Container (Hidden in presentation mode, reveals when clicking card) */}
        {!isPresenting && (
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isFocusedState || isDraggingState
                ? "opacity-100 max-h-24 pointer-events-auto"
                : "opacity-0 max-h-0 pointer-events-none group-focus-within/card:opacity-100 group-focus-within/card:max-h-24 group-focus-within/card:pointer-events-auto"
            }`}
          >
            <StickyNoteToolbar
              editorRef={editorRef}
              historyRef={historyRef}
              onContentChange={handleContentInput}
            />
          </div>
        )}

        {/* Rich Text Editor Body */}
        <div className="flex-1 p-3 overflow-y-auto relative text-current [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-current/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onKeyDown={handleEditorKeyDown}
            onMouseUp={handlePresentationMouseUp}
            style={getCursorStyle()}
            data-placeholder={t.stickyNotes.writePlaceholder}
            className="w-full h-full outline-none text-[13px] leading-relaxed font-medium min-h-[100px] text-current empty:before:content-[attr(data-placeholder)] empty:before:opacity-40 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
          />
        </div>

        {/* Multi-edge and Corner Resize Handles */}
        <div onPointerDown={(e) => handlePointerDownResize("n", e)} className="absolute top-0 left-3 right-3 h-1.5 cursor-n-resize z-10" />
        <div onPointerDown={(e) => handlePointerDownResize("s", e)} className="absolute bottom-0 left-3 right-3 h-1.5 cursor-s-resize z-10" />
        <div onPointerDown={(e) => handlePointerDownResize("w", e)} className="absolute top-3 bottom-3 left-0 w-1.5 cursor-w-resize z-10" />
        <div onPointerDown={(e) => handlePointerDownResize("e", e)} className="absolute top-3 bottom-3 right-0 w-1.5 cursor-e-resize z-10" />

        <div onPointerDown={(e) => handlePointerDownResize("nw", e)} className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-20" />
        <div onPointerDown={(e) => handlePointerDownResize("ne", e)} className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-20" />
        <div onPointerDown={(e) => handlePointerDownResize("sw", e)} className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-20" />
        <div
          onPointerDown={(e) => handlePointerDownResize("se", e)}
          title="Kéo để thay đổi kích thước"
          className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity z-20 text-current"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="8" cy="4" r="1.5" />
          </svg>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
          <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border p-6 rounded-2xl shadow-2xl z-[9999]">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="rounded-xl text-xs px-4"
              >
                {t.common.cancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  deleteMutation.mutate(note.id);
                  setIsConfirmDeleteOpen(false);
                }}
                className="rounded-xl text-xs px-4 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {t.common.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export const StickyNoteItem = memo(StickyNoteItemComponent, (prev, next) => {
  return (
    prev.note.id === next.note.id &&
    prev.note.title === next.note.title &&
    prev.note.content === next.note.content &&
    prev.note.color === next.note.color &&
    prev.note.isPinned === next.note.isPinned &&
    prev.note.isVisible === next.note.isVisible &&
    prev.note.positionX === next.note.positionX &&
    prev.note.positionY === next.note.positionY &&
    prev.note.width === next.note.width &&
    prev.note.height === next.note.height &&
    prev.note.zIndex === next.note.zIndex
  );
});
