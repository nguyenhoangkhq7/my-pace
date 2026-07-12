"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTranslation } from "@/hooks/use-translation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { SoundscapePlayer } from "./SoundscapePlayer";
import { SoundscapeAddForm } from "./SoundscapeAddForm";
import { SoundscapeHistoryItem } from "./SoundscapeHistoryItem";
import { useBoardStore } from "@/features/board/store/board.store";
import { cn, fetchYouTubeTitle } from "@/lib/utils";
import { CopyPlus, Settings2, LayoutGrid, List, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface FlowZenZoneProps {
  /** Called when user clicks X or squeezes panel to exit Zen Full mode */
  onExit?: () => void;
}

export function FlowZenZone({ onExit }: FlowZenZoneProps) {
  const { t } = useTranslation();
  const { 
    youtubeUrl, setYoutubeUrl, youtubeHistory, removeFromHistory, updateHistoryTitle, isZenFull, setZenFull,
    activeTaskId, pomodoroState, timeLeft, startTimer, pauseTimer, isPomodoroFloating, setPomodoroFloating,
    addToHistory, setIsSettingsOpen
  } = useFocusStore();
  const { tasks } = useBoardStore();
  const [isAdding, setIsAdding] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");
  const [isDragOver, setIsDragOver] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const html = e.dataTransfer.getData("text/html");
      const uri = e.dataTransfer.getData("text/uri-list");
      const plain = e.dataTransfer.getData("text/plain");
      
      let url = uri || plain;
      
      // If html contains href, parse it (sometimes browsers pass rich html for links)
      if (!url && html) {
        const match = html.match(/href="([^"]+)"/);
        if (match) url = match[1];
      }

      if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
        let title = "YouTube Video (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")";
        const fetchedTitle = await fetchYouTubeTitle(url);
        if (fetchedTitle) title = fetchedTitle;
        
        addToHistory(url, title);
        setYoutubeUrl(url);
        toast.success("Đã thêm video vào danh sách!");
      } else {
        toast.error("Không tìm thấy link YouTube hợp lệ. Vui lòng thử lại!");
        console.error("Drop data:", { uri, plain, html });
      }
    } catch (err) {
      toast.error("Không thể lấy dữ liệu kéo thả.");
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.includes("youtube.com") || text.includes("youtu.be"))) {
        let title = "YouTube Video (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")";
        const fetchedTitle = await fetchYouTubeTitle(text);
        if (fetchedTitle) title = fetchedTitle;
        
        addToHistory(text, title);
        setYoutubeUrl(text);
        toast.success("Đã thêm video từ Clipboard!");
      } else {
        toast.error("Clipboard không chứa link YouTube hợp lệ.");
      }
    } catch (error) {
      toast.error("Không thể đọc từ Clipboard. Hãy cấp quyền cho trình duyệt.");
    }
  };

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const text = e.clipboardData?.getData("text") || "";
      if (text && (text.includes("youtube.com") || text.includes("youtu.be"))) {
        e.preventDefault();
        
        let title = "YouTube Video (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")";
        const fetchedTitle = await fetchYouTubeTitle(text);
        if (fetchedTitle) title = fetchedTitle;
        
        addToHistory(text, title);
        setYoutubeUrl(text);
        toast.success("Đã thêm video bằng phím tắt Paste!");
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [addToHistory, setYoutubeUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Fallback: direct store call (shouldn't normally happen with current FlowPage setup)
      setZenFull(false);
    }
  };

  // ─── Zen Full Mode ────────────────────────────────────────────────────────────
  if (isZenFull) {
    return (
      <div className="fixed inset-0 z-[100] h-full w-full flex flex-col overflow-hidden bg-background">
        {/* Exit (X) button — top right, above everything */}
        <button
          onClick={handleExit}
          title="Thu nhỏ (Esc)"
          className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>

        {/* Video player — fills full width with 16:9 ratio, capped at 62vh */}
        <SoundscapePlayer />

        {/* Soundscape list — scrollable below video */}
        <div 
          className={cn("flex-1 flex flex-col min-h-0 overflow-hidden relative transition-colors", isDragOver ? "bg-primary/5" : "")}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md border-2 border-dashed border-primary flex items-center justify-center rounded-xl m-2 pointer-events-none">
              <div className="text-center">
                <HugeiconsIcon icon={PlusSignIcon} size={32} className="mx-auto text-primary mb-2" />
                <p className="text-primary font-bold tracking-wide">Thả để thêm video</p>
              </div>
            </div>
          )}

          <div className="px-6 py-3 flex items-center justify-between shrink-0 border-b border-border/50">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t.flow.soundscapeTitle}
            </h3>
            <div className="flex items-center gap-3">
              {/* COMPACT INLINE POMODORO WIDGET */}
              {activeTaskId && !isPomodoroFloating && (
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
                  
                  <span className="text-xs font-semibold text-muted-foreground truncate max-w-[150px]" title={activeTask?.title}>
                    {activeTask?.title || "Focus Session"}
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
              )}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePasteFromClipboard}
                  className="text-muted-foreground hover:text-primary bg-card hover:bg-primary/10 border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  title="Thêm từ Clipboard"
                >
                  <CopyPlus size={14} />
                </button>
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  title="Thêm thủ công"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                </button>
                <button
                  onClick={() => setLayoutMode(prev => prev === "list" ? "grid" : "list")}
                  className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  title={layoutMode === "list" ? "Chuyển sang dạng lưới (Grid)" : "Chuyển sang dạng danh sách (List)"}
                >
                  {layoutMode === "list" ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Cài đặt & Tuỳ chọn"
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
                      <LogOut className="w-4 h-4 text-rose-400" /> Thoát Zen Full Mode
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {isAdding && (
            <div className="px-6 pt-3 pb-1 shrink-0">
              <SoundscapeAddForm onCancel={() => setIsAdding(false)} />
            </div>
          )}

          <div className={cn("flex-1 px-6 py-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent", layoutMode === "grid" ? "grid grid-rows-2 grid-flow-col auto-cols-[240px] sm:auto-cols-[280px] md:auto-cols-[320px] gap-4 overflow-x-auto overflow-y-hidden content-start" : "overflow-y-auto space-y-2")}>
            {youtubeHistory.length === 0 && !isAdding && (
              <div className="text-center text-xs font-medium text-muted-foreground py-6 col-span-full">
                No saved playlists yet.
              </div>
            )}
            {youtubeHistory.map((item) => (
              <SoundscapeHistoryItem
                key={item.url}
                title={item.title}
                url={item.url}
                isPlaying={item.url === youtubeUrl}
                onPlay={() => setYoutubeUrl(item.url)}
                onRemove={() => removeFromHistory(item.url)}
                onRename={(newTitle) => updateHistoryTitle(item.url, newTitle)}
                layout={layoutMode}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal 3-column mode ─────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col border-l border-border bg-background min-h-0 min-w-[220px]">
      {/* YouTube Player */}
      <SoundscapePlayer />

      {/* Soundscape History */}
      <div 
        className={cn("flex-1 flex flex-col min-h-0 relative transition-colors", isDragOver ? "bg-primary/5" : "")}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md border-2 border-dashed border-primary flex items-center justify-center rounded-xl m-2 pointer-events-none">
            <div className="text-center">
              <HugeiconsIcon icon={PlusSignIcon} size={32} className="mx-auto text-primary mb-2" />
              <p className="text-primary font-bold tracking-wide">Thả để thêm video</p>
            </div>
          </div>
        )}

        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.soundscapeTitle}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePasteFromClipboard}
              className="text-muted-foreground hover:text-primary bg-card hover:bg-primary/10 border border-border p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Thêm từ Clipboard"
            >
              <CopyPlus size={14} />
            </button>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Thêm thủ công"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
            </button>
            <button
              onClick={() => setLayoutMode(prev => prev === "list" ? "grid" : "list")}
              className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors cursor-pointer"
              title={layoutMode === "list" ? "Chuyển sang dạng lưới" : "Chuyển sang danh sách"}
            >
              {layoutMode === "list" ? <LayoutGrid size={14} /> : <List size={14} />}
            </button>
          </div>
        </div>

        {isAdding && (
          <SoundscapeAddForm onCancel={() => setIsAdding(false)} />
        )}

        <div className={cn("flex-1 px-4 pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent", layoutMode === "grid" ? "grid grid-rows-2 grid-flow-col auto-cols-[240px] gap-3 overflow-x-auto overflow-y-hidden content-start" : "overflow-y-auto space-y-3")}>
          {youtubeHistory.length === 0 && !isAdding && (
            <div className="text-center text-xs font-medium text-muted-foreground py-6 col-span-full">
              No saved playlists yet.
            </div>
          )}
          {youtubeHistory.map((item) => (
            <SoundscapeHistoryItem
              key={item.url}
              title={item.title}
              url={item.url}
              isPlaying={item.url === youtubeUrl}
              onPlay={() => setYoutubeUrl(item.url)}
              onRemove={() => removeFromHistory(item.url)}
              onRename={(newTitle) => updateHistoryTitle(item.url, newTitle)}
              layout={layoutMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
