"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTranslation } from "@/hooks/use-translation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { SoundscapePlayer } from "./SoundscapePlayer";
import { SoundscapeAddForm } from "./SoundscapeAddForm";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { Task } from "@/features/board/types";
import { cn, fetchYouTubeTitle } from "@/lib/utils";
import { Settings2, LayoutGrid, List, LogOut, PanelRightClose } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ZenMediaDropzone } from "./ZenMediaDropzone";
import { SoundscapeHistoryList } from "./SoundscapeHistoryList";

interface FlowZenZoneProps {
  /** Called when user clicks X or squeezes panel to exit Zen Full mode */
  onExit?: () => void;
  /** Called to collapse the Zen Zone panel */
  onCollapse?: () => void;
}

function ZenFullInlineWidget({ activeTaskTitle }: { activeTaskTitle?: string }) {
  const isZenFull = useFocusStore((s) => s.isZenFull);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const isPomodoroFloating = useFocusStore((s) => s.isPomodoroFloating);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const timeLeft = useFocusStore((s) => s.timeLeft);
  const startTimer = useFocusStore((s) => s.startTimer);
  const pauseTimer = useFocusStore((s) => s.pauseTimer);
  const setPomodoroFloating = useFocusStore((s) => s.setPomodoroFloating);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isZenFull || !activeTaskId || isPomodoroFloating) return null;

  return (
    <div className="flex items-center bg-card border border-border rounded-xl pl-4 pr-1.5 py-1.5 shadow-sm h-11 gap-3.5">
      <div className="flex flex-col justify-center min-w-[40px]">
        <span className={cn("text-[9px] font-bold uppercase leading-none tracking-wider", pomodoroState === "focusing" ? "text-primary" : "text-emerald-400")}>
          {pomodoroState === "focusing" ? "Focus" : "Break"}
        </span>
        <span className="text-base font-black text-foreground tabular-nums leading-none mt-[3px]">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="h-6 w-px bg-border" />

      <span className="text-xs font-semibold text-muted-foreground truncate max-w-[150px]" title={activeTaskTitle}>
        {activeTaskTitle || "Focus Session"}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={pomodoroState === "focusing" || pomodoroState === "breaking" ? pauseTimer : startTimer}
          className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors cursor-pointer"
        >
          {pomodoroState === "focusing" || pomodoroState === "breaking" ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button
          onClick={() => setPomodoroFloating(true)}
          className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground transition-colors flex items-center justify-center cursor-pointer"
          title="Float widget"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3l-6 6"/><path d="M21 3v6"/><path d="M21 3h-6"/><path d="M14 9L9 14"/><path d="M9 21v-6"/><path d="M9 21h6"/><path d="M9 21l6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

export function FlowZenZone({ onExit, onCollapse }: FlowZenZoneProps) {
  const { t } = useTranslation();
  const youtubeUrl = useFocusStore((s) => s.youtubeUrl);
  const setYoutubeUrl = useFocusStore((s) => s.setYoutubeUrl);
  const youtubeHistory = useFocusStore((s) => s.youtubeHistory);
  const removeFromHistory = useFocusStore((s) => s.removeFromHistory);
  const updateHistoryTitle = useFocusStore((s) => s.updateHistoryTitle);
  const isZenFull = useFocusStore((s) => s.isZenFull);
  const setZenFull = useFocusStore((s) => s.setZenFull);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const addToHistory = useFocusStore((s) => s.addToHistory);
  const setIsSettingsOpen = useFocusStore((s) => s.setIsSettingsOpen);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => fetchClient.get<Task[]>('tasks').then(r => r.data) });
  const [isAdding, setIsAdding] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");
  const [isDragOver, setIsDragOver] = useState(false);

  const activeTask = tasks.find((t: Task) => t.id === activeTaskId);

  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/my-pace-soundscape-reorder")) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/my-pace-soundscape-reorder")) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/my-pace-soundscape-reorder")) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/my-pace-soundscape-reorder")) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const text = e.dataTransfer.getData("text");
    if (text && (text.includes("youtube.com") || text.includes("youtu.be"))) {
      toast.promise(
        (async () => {
          const title = await fetchYouTubeTitle(text);
          addToHistory(text, title || "YouTube Soundscape");
          setYoutubeUrl(text);
        })(),
        {
          loading: "Fetching YouTube link...",
          success: "Soundscape added!",
          error: "Failed to add Soundscape"
        }
      );
    }
  };

  // Listen for global paste events
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text && (text.includes("youtube.com") || text.includes("youtu.be"))) {
        toast.promise(
          (async () => {
            const title = await fetchYouTubeTitle(text);
            addToHistory(text, title || "YouTube Soundscape");
            setYoutubeUrl(text);
          })(),
          {
            loading: "Fetching YouTube link from paste...",
            success: "Soundscape added!",
            error: "Failed to add Soundscape"
          }
        );
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [addToHistory, setYoutubeUrl]);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      setZenFull(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col min-h-0 transition-colors duration-300",
      isVideoBackground ? "bg-background/40 backdrop-blur-md" : "bg-background",
      isZenFull 
        ? "fixed inset-0 z-[100] h-full w-full overflow-hidden" 
        : "h-full border-l border-border min-w-[220px]"
    )}>
      {/* Video player — using key to guarantee DOM identity */}
      <SoundscapePlayer key="soundscape-player" />

      {/* Soundscape content area — using key to guarantee DOM identity */}
      <ZenMediaDropzone
        key="zen-media-dropzone"
        className={cn(
          "flex-1 flex flex-col min-h-0",
          isZenFull && "overflow-hidden"
        )}
        isDragOver={isDragOver}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          "flex flex-col shrink-0 gap-1.5",
          isZenFull ? "px-6 py-3 border-b border-border/50" : "p-5 pb-3"
        )}>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t.flow.soundscapeTitle}
            </h3>
            <div className="flex items-center gap-3">
              <ZenFullInlineWidget activeTaskTitle={activeTask?.title} />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center",
                    isVideoBackground ? "bg-card/60 backdrop-blur-xs hover:bg-card/80" : "bg-card hover:bg-muted"
                  )}
                  title={t.flow.player.addManual}
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                </button>
                <button
                  onClick={() => setLayoutMode(prev => prev === "list" ? "grid" : "list")}
                  className={cn(
                    "text-muted-foreground hover:text-foreground border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center",
                    isVideoBackground ? "bg-card/60 backdrop-blur-xs hover:bg-card/80" : "bg-card hover:bg-muted"
                  )}
                  title={layoutMode === "list" ? t.flow.player.switchToGrid : t.flow.player.switchToList}
                >
                  {layoutMode === "list" ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>

                {!isZenFull && onCollapse && (
                  <button
                    onClick={onCollapse}
                    className={cn(
                      "text-muted-foreground hover:text-rose-400 border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center",
                      isVideoBackground ? "bg-card/60 backdrop-blur-xs hover:bg-rose-500/20" : "bg-card hover:bg-rose-500/10"
                    )}
                    title={t.flow.player.hideZenZone}
                  >
                    <PanelRightClose size={14} />
                  </button>
                )}

                {/* Dropdown Menu & Exit button — only in Zen Full */}
                {isZenFull && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "text-muted-foreground hover:text-foreground border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center",
                            isVideoBackground ? "bg-card/60 backdrop-blur-xs hover:bg-card/80" : "bg-card hover:bg-muted"
                          )}
                          title={t.flow.player.settingsAndOptions}
                        >
                          <Settings2 size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border text-foreground shadow-xl min-w-48 z-[200]">
                        <DropdownMenuItem
                          onClick={() => setIsSettingsOpen(true)}
                          className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-muted-foreground hover:text-foreground"
                        >
                          <Settings2 className="w-4 h-4 text-muted-foreground" /> {t.flow.pomodoroConfig}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleExit}
                          className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-rose-400 hover:text-rose-300"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" /> {t.flow.player.exitZenFull}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                      onClick={handleExit}
                      className={cn(
                        "text-muted-foreground hover:text-rose-400 border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center",
                        isVideoBackground ? "bg-card/60 backdrop-blur-xs hover:bg-rose-500/20" : "bg-card hover:bg-rose-500/10"
                      )}
                      title={t.flow.player.exitZenFullEsc}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground/50 leading-normal">
            {t.flow.pasteHint}
          </span>
        </div>

        {isAdding && (
          <div className={cn("pt-3 pb-1 shrink-0", isZenFull ? "px-6" : "px-5")}>
            <SoundscapeAddForm onCancel={() => setIsAdding(false)} />
          </div>
        )}

        <SoundscapeHistoryList
          history={youtubeHistory}
          isAdding={isAdding}
          layoutMode={layoutMode}
          currentUrl={youtubeUrl}
          onPlay={setYoutubeUrl}
          onRemove={removeFromHistory}
          onRename={updateHistoryTitle}
          isZenFull={isZenFull}
        />
      </ZenMediaDropzone>
    </div>
  );
}
