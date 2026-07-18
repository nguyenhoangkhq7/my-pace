"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTaskAction } from "@/features/board/actions/task.action";
import type { Task } from "@/features/board/types";
import { cn } from "@/lib/utils";
import { NotebookPen, ChevronDown, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TaskNotesPanelProps {
  task: Task;
}

export function TaskNotesPanel({ task }: TaskNotesPanelProps) {
  const queryClient = useQueryClient();
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
    mutationFn: (notes: string) => updateTaskAction(task.id, { notes }),
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
          "flex items-center gap-2 mx-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 group",
          isOpen && "text-foreground bg-muted/40"
        )}
      >
        <NotebookPen className="w-3.5 h-3.5 shrink-0" />
        <span>
          {hasNotes ? "Notes" : "Thêm note"}
          {hasNotes && (
            <span className="ml-1.5 w-1.5 h-1.5 inline-block rounded-full bg-indigo-400 align-middle" />
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
        <div className="relative rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Ghi chú nhanh cho task này... (tự động lưu)"
            rows={4}
            className={cn(
              "w-full resize-none bg-transparent pl-4 pr-10 pt-3 pb-8 text-sm text-foreground",
              "placeholder:text-muted-foreground/50 focus:outline-none",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            )}
          />
          {/* Maximize button */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Phóng to ghi chú"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {/* Auto-save indicator */}
          <div className="absolute bottom-2 right-3 text-[10px] font-medium text-muted-foreground/60 select-none">
            {isSaving ? "Đang lưu..." : draft !== (task.notes ?? "") ? "" : draft ? "✓ Đã lưu" : ""}
          </div>
        </div>
      </div>

      {/* Expanded Notes Modal */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl h-[70vh] flex flex-col p-6 rounded-2xl bg-card border border-border z-[200]">
          <DialogHeader className="border-b border-border/50 pb-3 flex flex-row items-center gap-2 select-none">
            <NotebookPen className="w-4 h-4 text-indigo-400" />
            <DialogTitle className="text-sm font-semibold text-foreground">
              Ghi chú: {task.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 relative mt-4">
            <textarea
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Ghi chú chi tiết cho task này... (tự động lưu)"
              className={cn(
                "w-full h-full resize-none bg-transparent text-sm text-foreground",
                "placeholder:text-muted-foreground/50 focus:outline-none",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
            />
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground select-none">
            <div>
              {isSaving ? "Đang lưu..." : draft !== (task.notes ?? "") ? "" : draft ? "✓ Đã lưu thay đổi" : ""}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-1.5 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
