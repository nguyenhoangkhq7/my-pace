"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { Task } from "@/features/board/types";
import { cn } from "@/lib/utils";
import { NotebookPen, ChevronDown, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTranslation } from "@/hooks/use-translation";

interface TaskNotesPanelProps {
  task: Task;
}

export function TaskNotesPanel({ task }: TaskNotesPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState(task.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prevTaskId, setPrevTaskId] = useState(task.id);

  // Sync draft when task changes (e.g. switching tasks)
  if (task.id !== prevTaskId) {
    setPrevTaskId(task.id);
    setDraft(task.notes ?? "");
  }

  // Auto-focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const updateMutation = useMutation({
    mutationFn: (notes: string) => fetchClient.put(`tasks/${task.id}`, { notes }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsSaving(false);
    },
    onError: () => setIsSaving(false),
  });

  const handleChange = (value: string) => {
    setDraft(value);
    setIsSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateMutation.mutate(value);
    }, 800);
  };

  const hasNotes = !!task.notes?.trim();

  return (
    <div className="w-full mt-4 shrink-0">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 mx-auto px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm",
          isVideoBackground
            ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          isOpen && (isVideoBackground ? "bg-white/20 border-white/30 text-white" : "text-foreground bg-muted/40")
        )}
      >
        <NotebookPen className="w-3.5 h-3.5 shrink-0" />
        <span>
          {hasNotes ? t.flow.taskNotes.hasNotes : t.flow.taskNotes.addNotes}
          {hasNotes && (
            <span className="ml-1.5 w-1.5 h-1.5 inline-block rounded-full bg-indigo-400 align-middle shadow-[0_0_6px_rgba(129,140,248,0.9)]" />
          )}
        </span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible notes area */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-52 opacity-100 mt-2" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn(
          "relative rounded-xl border overflow-hidden transition-all duration-300",
          isVideoBackground
            ? "bg-black/35 backdrop-blur-md border-white/20 shadow-xl"
            : "border-border bg-card/60 backdrop-blur-sm"
        )}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t.flow.taskNotes.quickPlaceholder}
            rows={4}
            className={cn(
              "w-full resize-none bg-transparent pl-4 pr-10 pt-3 pb-8 text-sm font-medium",
              isVideoBackground ? "text-white placeholder:text-white/40" : "text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            )}
          />
          {/* Maximize button */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            title={t.flow.taskNotes.expandTitle}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {/* Auto-save indicator */}
          <div className="absolute bottom-2 right-3 text-[10px] font-medium text-muted-foreground/60 select-none">
            {isSaving ? t.flow.taskNotes.saving : draft !== (task.notes ?? "") ? "" : draft ? t.flow.taskNotes.saved : ""}
          </div>
        </div>
      </div>

      {/* Expanded Notes Modal — Liquid Glassmorphism */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          aria-describedby={undefined}
          className={cn(
            "max-w-2xl h-[70vh] flex flex-col p-6 rounded-3xl z-[200] transition-all duration-300 shadow-2xl border backdrop-blur-2xl overflow-hidden",
            isVideoBackground
              ? "bg-black/55 border-white/20 text-white shadow-[0_16px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
              : "bg-card/85 dark:bg-card/85 border-border/80 text-card-foreground shadow-[0_16px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
          )}
        >
          <DialogHeader className="border-b border-border/50 pb-3 flex flex-row items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <NotebookPen className="w-4 h-4 text-indigo-400" />
            </div>
            <DialogTitle className="text-sm font-bold tracking-tight text-foreground">
              {t.flow.taskNotes.title(task.title)}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 relative mt-4">
            <textarea
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={t.flow.taskNotes.detailPlaceholder}
              className={cn(
                "w-full h-full resize-none bg-transparent text-sm leading-relaxed font-medium",
                isVideoBackground ? "text-white placeholder:text-white/40" : "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
            />
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground select-none">
            <div className="font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
              {isSaving ? (
                <span className="animate-pulse">{t.flow.taskNotes.saving}</span>
              ) : draft !== (task.notes ?? "") ? (
                ""
              ) : draft ? (
                <span>{t.flow.taskNotes.savedChanges}</span>
              ) : (
                ""
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-5 py-2 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-95 cursor-pointer"
            >
              {t.flow.taskNotes.close}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
