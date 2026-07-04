import { useState } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { YoutubeIcon, PlayIcon, Delete02Icon, PlusSignIcon, FullscreenIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function FlowZenZone() {
  const { youtubeUrl, setYoutubeUrl, youtubeHistory, addToHistory, removeFromHistory, isZenMaximized, toggleZenMaximize, pomodoroState } = useFocusStore();
  
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const parseYouTubeUrl = (url: string) => {
    let videoId = null;
    let listId = null;

    const vidRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
    const vidMatch = url.match(vidRegExp);
    if (vidMatch && vidMatch[2].length === 11) {
      videoId = vidMatch[2];
    }

    const listRegExp = /[?&]list=([^#&?]+)/;
    const listMatch = url.match(listRegExp);
    if (listMatch && listMatch[1]) {
      listId = listMatch[1];
    }

    return { videoId, listId };
  };

  const { videoId, listId } = parseYouTubeUrl(youtubeUrl);

  const getEmbedUrl = () => {
    if (listId && videoId) {
      return `https://www.youtube.com/embed/${videoId}?list=${listId}`;
    } else if (listId) {
      return `https://www.youtube.com/embed/videoseries?list=${listId}`;
    } else if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?loop=1&playlist=${videoId}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    
    let title = inputTitle.trim();
    if (!title) {
      const { videoId, listId } = parseYouTubeUrl(inputUrl);
      title = listId ? `Playlist ${listId.slice(0, 5)}` : (videoId ? `Video ${videoId}` : "Unknown Stream");
    }

    addToHistory(inputUrl, title);
    setYoutubeUrl(inputUrl);
    setInputUrl("");
    setInputTitle("");
    setIsAdding(false);
  };

  return (
    <div className="h-full flex flex-col border-l border-border bg-background min-h-0">
      {/* Top Half: YouTube Player */}
      <div className="p-4 border-b border-border shrink-0">
        {/* Responsive 16:9 container capped at 220px height */}
        <div
          className="relative w-full rounded-xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-black group cursor-pointer"
          style={{ paddingBottom: "min(56.25%, 220px)" }}
        >
          {/* Overlay to dim the video during focus mode */}
          <div className={cn(
            "absolute inset-0 transition-colors duration-500 pointer-events-none z-10",
            (pomodoroState === "focusing" && !isZenMaximized)
              ? "bg-black/40 group-hover:bg-transparent"
              : "bg-transparent"
          )}></div>
          {embedUrl ? (
            <iframe
              className={cn(
                "absolute inset-0 w-full h-full transition-all duration-700",
                (pomodoroState === "focusing" && !isZenMaximized)
                  ? "grayscale-[60%] group-hover:grayscale-0"
                  : "grayscale-0"
              )}
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
              Invalid YouTube URL
            </div>
          )}
          {/* Maximize / Restore button — visible on hover */}
          <button
            onClick={toggleZenMaximize}
            title={isZenMaximized ? "Thu nhỏ" : "Phóng to"}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 hover:scale-110"
          >
            <HugeiconsIcon icon={isZenMaximized ? Cancel01Icon : FullscreenIcon} size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Half: History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Soundscape</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
          </button>
        </div>

        {isAdding && (
          <div className="px-4 pb-4">
            <form onSubmit={handleAddSubmit} className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-inner">
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube link..."
                className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
              <input 
                type="text" 
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Title (e.g. Lofi Coding)..."
                className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded shadow">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {youtubeHistory.length === 0 && !isAdding && (
            <div className="text-center text-xs font-medium text-muted-foreground py-6">
              No saved playlists yet.
            </div>
          )}
          {youtubeHistory.map((item, index) => {
            const isPlaying = item.url === youtubeUrl;
            return (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border group transition-all",
                  isPlaying 
                    ? "bg-card border-indigo-500/55 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "bg-card border-border hover:border-border/80 hover:bg-muted"
                )}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className={cn(
                    "text-sm truncate tracking-wide",
                    isPlaying ? "text-indigo-300 font-bold" : "text-foreground font-medium"
                  )}>
                    {item.title}
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isPlaying && (
                    <button 
                      onClick={() => setYoutubeUrl(item.url)}
                      className="text-muted-foreground hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors"
                      title="Play"
                    >
                      <HugeiconsIcon icon={PlayIcon} size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => removeFromHistory(item.url)}
                    className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Remove"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </button>
                </div>
                {isPlaying && (
                  <div className="shrink-0 flex items-end space-x-0.5 px-1 h-3 group-hover:hidden">
                    <div className="w-[3px] h-2 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                    <div className="w-[3px] h-3 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]"></div>
                    <div className="w-[3px] h-2.5 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
