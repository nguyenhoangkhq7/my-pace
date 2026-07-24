"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  Check,
  Highlighter,
  Eraser,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { applyHighlightToSelection, clearHighlightFromSelection, clearTextColorFromSelection } from "../utils/highlight-engine";
import type { EditorHistory } from "../utils/editor-history";
import { useTranslation } from "@/hooks/use-translation";

interface StickyNoteToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  historyRef: React.RefObject<EditorHistory | null>;
  onContentChange: () => void;
}

const FONT_SIZES = [
  { label: "S", desc: "12px", value: "2" },
  { label: "M", desc: "14px", value: "3" },
  { label: "L", desc: "16px", value: "4" },
  { label: "XL", desc: "18px", value: "5" },
  { label: "H", desc: "24px", value: "6" },
];

function normalizeColor(color: string): string {
  if (!color || color === "inherit" || color === "currentColor" || color === "transparent") return "inherit";
  if (color.startsWith("rgb")) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0], 10).toString(16).padStart(2, "0");
      const g = parseInt(matches[1], 10).toString(16).padStart(2, "0");
      const b = parseInt(matches[2], 10).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`.toLowerCase();
    }
  }
  return color.toLowerCase();
}

export function StickyNoteToolbar({ editorRef, onContentChange }: StickyNoteToolbarProps) {
  const { t } = useTranslation();
  const savedRangeRef = useRef<Range | null>(null);
  const [currentFontSizeLabel, setCurrentFontSizeLabel] = useState("M");
  const [activeFontSize, setActiveFontSize] = useState("3");
  const [activeColor, setActiveColor] = useState("inherit");
  const [activeHighlightColor, setActiveHighlightColor] = useState("#fef08a");
  const [isHighlightPenActive, setIsHighlightPenActive] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);

  const TEXT_COLORS = [
    { name: "Mặc định", color: "inherit" },
    { name: "Đen", color: "#111827" },
    { name: "Xám", color: "#6b7280" },
    { name: "Đỏ", color: "#dc2626" },
    { name: "Xanh dương", color: "#2563eb" },
    { name: "Xanh lá", color: "#16a34a" },
    { name: "Tím", color: "#9333ea" },
    { name: "Cam", color: "#d97706" },
    { name: "Hồng", color: "#db2777" },
  ];

  const HIGHLIGHT_COLORS = [
    { name: t.stickyNotes.colorAmber, color: "#fef08a" },
    { name: t.stickyNotes.colorEmerald, color: "#bbf7d0" },
    { name: t.stickyNotes.colorRose, color: "#fbcfe8" },
    { name: "Cam neon", color: "#fed7aa" },
    { name: "Xanh biển", color: "#a5f3fc" },
  ];

  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
  });

  const toggleHighlightPenMode = (overrideColor?: string) => {
    const colorToUse = overrideColor || activeHighlightColor;
    setIsEraserActive(false);

    setIsHighlightPenActive((prev) => {
      const nextState = overrideColor ? true : !prev;
      if (nextState && editorRef.current) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && editorRef.current.contains(sel.anchorNode)) {
          applyHighlightToSelection(editorRef.current, colorToUse);
          onContentChange();
        }
      }
      return nextState;
    });
  };

  const toggleEraserMode = () => {
    setIsHighlightPenActive(false);
    setIsEraserActive((prev) => {
      const nextState = !prev;
      if (nextState && editorRef.current) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && editorRef.current.contains(sel.anchorNode)) {
          clearHighlightFromSelection(editorRef.current);
          onContentChange();
        }
      }
      return nextState;
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (isHighlightPenActive) {
      editor.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23facc15' stroke='%23854d0e' stroke-width='2'%3E%3Cpath d='m9 11-6 6v3h3l6-6'/%3E%3Cpath d='m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'/%3E%3C/svg%3E") 0 22, text`;
    } else if (isEraserActive) {
      editor.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23ef4444' stroke='%23991b1b' stroke-width='2'%3E%3Cpath d='m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l6.3 6.3a1 1 0 0 1 0 1.4l-6.3 6.3a1 1 0 0 1-1.4 0Z'/%3E%3Cpath d='m22 21-10 0'/%3E%3C/svg%3E") 0 22, text`;
    } else {
      editor.style.cursor = "";
    }

    const handleMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;

        if (isHighlightPenActive) {
          const changed = applyHighlightToSelection(editor, activeHighlightColor);
          if (changed) onContentChange();
        } else if (isEraserActive) {
          const changed = clearHighlightFromSelection(editor);
          if (changed) onContentChange();
        }
      }, 20);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHighlightPenActive(false);
        setIsEraserActive(false);
      }
    };

    editor.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      editor.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorRef, isHighlightPenActive, isEraserActive, activeHighlightColor, onContentChange]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, [editorRef]);

  const restoreSelection = useCallback(() => {
    if (savedRangeRef.current && editorRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  }, [editorRef]);

  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) return;
    try {
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      });

      const fontVal = document.queryCommandValue("fontSize");
      if (fontVal) {
        setActiveFontSize(fontVal);
        const match = FONT_SIZES.find((f) => f.value === fontVal);
        if (match) setCurrentFontSizeLabel(match.label);
      }

      const colorVal = document.queryCommandValue("foreColor");
      if (colorVal) {
        setActiveColor(colorVal);
      }
    } catch { /* ignore */ }
  }, [editorRef]);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
        saveSelection();
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(updateActiveStates, 100);
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, [editorRef, saveSelection, updateActiveStates]);

  const execCmd = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    try { document.execCommand("styleWithCSS", false, "true"); } catch { /* ignore */ }
    document.execCommand(command, false, value);
    saveSelection();
    onContentChange();
    setTimeout(updateActiveStates, 10);
  };

  const btn = (isActive: boolean) =>
    `w-6.5 h-6.5 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer select-none ${
      isActive
        ? "bg-current/15 text-current font-bold ring-1 ring-current/30 scale-105 shadow-xs"
        : "opacity-60 hover:opacity-100 hover:bg-current/10"
    }`;

  const normActiveColor = normalizeColor(activeColor);

  return (
    <div className="flex items-center gap-1 px-2.5 py-1 bg-black/4 dark:bg-white/5 backdrop-blur-md border-b border-current/10 select-none text-current overflow-x-auto">
      {/* Bold */}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }} title={t.stickyNotes.bold} className={btn(activeStates.bold)}>
        <Bold className="w-3 h-3" />
      </button>
      {/* Italic */}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }} title={t.stickyNotes.italic} className={btn(activeStates.italic)}>
        <Italic className="w-3 h-3" />
      </button>
      {/* Underline */}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }} title={t.stickyNotes.underline} className={btn(activeStates.underline)}>
        <Underline className="w-3 h-3" />
      </button>
      {/* Strikethrough */}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("strikeThrough"); }} title={t.stickyNotes.strikethrough} className={btn(activeStates.strikeThrough)}>
        <Strikethrough className="w-3 h-3" />
      </button>

      <div className="w-px h-3.5 bg-current/20 mx-0.5" />

      {/* Font Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            title={t.stickyNotes.fontSize}
            className={`h-6.5 px-2 rounded-md text-[10px] font-bold transition-all duration-150 cursor-pointer select-none flex items-center gap-1 ${
              activeFontSize !== "3"
                ? "bg-current/15 text-current font-bold ring-1 ring-current/30 shadow-xs"
                : "opacity-60 hover:opacity-100 hover:bg-current/10"
            }`}
          >
            <span>{currentFontSizeLabel}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-1 min-w-[120px] bg-card border-border shadow-2xl z-[9999]">
          {FONT_SIZES.map((fs) => (
            <DropdownMenuItem
              key={fs.value}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd("fontSize", fs.value);
                setActiveFontSize(fs.value);
                setCurrentFontSizeLabel(fs.label);
              }}
              className={`flex items-center justify-between text-xs cursor-pointer py-1.5 px-2.5 rounded-md ${
                activeFontSize === fs.value ? "bg-primary/15 text-primary font-bold" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold w-3 text-center">{fs.label}</span>
                <span className="text-muted-foreground text-[10px]">({fs.desc})</span>
              </div>
              {activeFontSize === fs.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Text Color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            title={t.stickyNotes.textColor}
            className={`w-6.5 h-6.5 rounded-md flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none ${
              normActiveColor !== "inherit"
                ? "bg-current/15 text-current font-bold ring-1 ring-current/30 shadow-xs"
                : "opacity-60 hover:opacity-100 hover:bg-current/10"
            }`}
          >
            <span className="text-[10px] font-black leading-none tracking-tighter">A</span>
            <span
              className="w-3.5 h-0.5 rounded-full mt-0.5 shadow-xs"
              style={{
                backgroundColor: normActiveColor !== "inherit" ? activeColor : "currentColor",
              }}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-2 min-w-[140px] bg-card border-border shadow-2xl z-[9999]">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t.stickyNotes.textColor}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {TEXT_COLORS.map((tc) => {
              const normTarget = normalizeColor(tc.color);
              const isSelected = normActiveColor === normTarget;
              return (
                <button
                  key={tc.name}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (tc.color === "inherit") {
                      if (editorRef.current) {
                        restoreSelection();
                        clearTextColorFromSelection(editorRef.current);
                        onContentChange();
                        setActiveColor("inherit");
                      }
                    } else {
                      execCmd("foreColor", tc.color);
                      setActiveColor(tc.color);
                    }
                  }}
                  title={tc.name}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110 border-primary shadow-lg shadow-primary/30 z-10"
                      : "border-border/60 hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: tc.color !== "inherit" ? tc.color : undefined }}
                >
                  {tc.color === "inherit" && (
                    <span className="text-[10px] font-black" style={{ background: "linear-gradient(135deg, #dc2626, #2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>A</span>
                  )}
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        tc.color === "#000000" || tc.color === "#111827" || tc.color === "#2563eb" || tc.color === "#9333ea"
                          ? "text-white drop-shadow-md"
                          : "text-black drop-shadow-md"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-3.5 bg-current/20 mx-0.5" />

      {/* Highlight Pen */}
      <div className={`flex items-center rounded-md transition-all duration-150 ${
        isHighlightPenActive
          ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold ring-1 ring-amber-500/40 scale-105 shadow-xs"
          : "opacity-70 hover:opacity-100 hover:bg-current/10"
      }`}>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleHighlightPenMode();
          }}
          title={t.stickyNotes.penTool}
          className="h-6.5 px-1.5 rounded-l-md flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <Highlighter className="w-3 h-3 text-amber-500 dark:text-amber-400" />
          <span
            className="w-3 h-0.5 rounded-full mt-0.5"
            style={{ backgroundColor: activeHighlightColor }}
          />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
              title={t.stickyNotes.penTool}
              className="w-3 h-6.5 rounded-r-md flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100 border-l border-current/15"
            >
              <ChevronDown className="w-2 h-2" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-2 min-w-[140px] bg-card border-border shadow-2xl z-[9999]">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t.stickyNotes.penTool}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {HIGHLIGHT_COLORS.map((hc) => {
                const isSelected = normalizeColor(activeHighlightColor) === normalizeColor(hc.color);
                return (
                  <button
                    key={hc.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setActiveHighlightColor(hc.color);
                      toggleHighlightPenMode(hc.color);
                    }}
                    title={hc.name}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-amber-500 scale-110 border-white shadow-md z-10"
                        : "border-black/20 opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: hc.color }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black font-bold stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Eraser */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleEraserMode();
        }}
        title={t.stickyNotes.eraser}
        className={`w-6.5 h-6.5 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer select-none ${
          isEraserActive
            ? "bg-red-500/20 text-red-500 font-bold ring-1 ring-red-500/40 scale-105 shadow-xs"
            : "opacity-70 hover:opacity-100 hover:bg-current/10 text-red-500 dark:text-red-400"
        }`}
      >
        <Eraser className="w-3 h-3" />
      </button>

      <div className="w-px h-3.5 bg-current/20 mx-0.5" />

      {/* List */}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList"); }} title={t.stickyNotes.list} className={btn(activeStates.insertUnorderedList)}>
        <List className="w-3 h-3" />
      </button>
    </div>
  );
}
