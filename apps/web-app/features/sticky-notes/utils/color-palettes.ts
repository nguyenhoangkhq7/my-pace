import type { StickyNoteColor } from "../types";

export interface ColorTheme {
  container: string;
  dot: string;
  headerBorder: string;
  penHighlight: string;
}

export const STICKY_NOTE_THEMES: Record<StickyNoteColor, ColorTheme> = {
  amber: {
    container:
      "bg-[#fffbeb] dark:bg-[#231b0c] border-[#fde047] dark:border-[#854d0e] text-slate-900 dark:text-[#fef08a] shadow-amber-500/10 dark:shadow-amber-900/20",
    dot: "bg-amber-400 dark:bg-amber-500",
    headerBorder: "border-amber-400/40 dark:border-amber-700/40",
    penHighlight: "#fef08a",
  },
  emerald: {
    container:
      "bg-[#ecfdf5] dark:bg-[#05261e] border-[#86efac] dark:border-[#047857] text-slate-900 dark:text-[#a7f3d0] shadow-emerald-500/10 dark:shadow-emerald-900/20",
    dot: "bg-emerald-400 dark:bg-emerald-500",
    headerBorder: "border-emerald-400/40 dark:border-emerald-700/40",
    penHighlight: "#bbf7d0",
  },
  indigo: {
    container:
      "bg-[#f0f3ff] dark:bg-[#16143c] border-[#a5b4fc] dark:border-[#4338ca] text-slate-900 dark:text-[#c7d2fe] shadow-indigo-500/10 dark:shadow-indigo-900/20",
    dot: "bg-indigo-400 dark:bg-indigo-500",
    headerBorder: "border-indigo-400/40 dark:border-indigo-700/40",
    penHighlight: "#c7d2fe",
  },
  rose: {
    container:
      "bg-[#fff1f2] dark:bg-[#2b0811] border-[#fda4af] dark:border-[#be123c] text-slate-900 dark:text-[#fecdd3] shadow-rose-500/10 dark:shadow-rose-900/20",
    dot: "bg-rose-400 dark:bg-rose-500",
    headerBorder: "border-rose-400/40 dark:border-rose-700/40",
    penHighlight: "#fbcfe8",
  },
  violet: {
    container:
      "bg-[#f5f3ff] dark:bg-[#1b0c30] border-[#d8b4fe] dark:border-[#6d28d9] text-slate-900 dark:text-[#e9d5ff] shadow-violet-500/10 dark:shadow-violet-900/20",
    dot: "bg-violet-400 dark:bg-violet-500",
    headerBorder: "border-violet-400/40 dark:border-violet-700/40",
    penHighlight: "#e9d5ff",
  },
  dark: {
    container:
      "bg-[#0f172a] dark:bg-[#090d16] border-slate-700 dark:border-slate-800 text-[#f8fafc] dark:text-[#f1f5f9] shadow-black/40",
    dot: "bg-slate-500 dark:bg-slate-400",
    headerBorder: "border-slate-700/40 dark:border-slate-800/60",
    penHighlight: "#fef08a",
  },
};
