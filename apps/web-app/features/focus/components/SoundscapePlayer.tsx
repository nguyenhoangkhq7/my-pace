"use client";

import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { FullscreenIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function SoundscapePlayer() {
  const { youtubeUrl, isZenMaximized, toggleZenMaximize, pomodoroState } = useFocusStore();

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

  return (
    <div className="p-4 border-b border-border shrink-0">
      <div
        className="relative w-full rounded-xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-black group cursor-pointer"
        style={{ paddingBottom: "min(56.25%, 220px)" }}
      >
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-500 pointer-events-none z-10",
            pomodoroState === "focusing" && !isZenMaximized
              ? "bg-black/40 group-hover:bg-transparent"
              : "bg-transparent"
          )}
        />
        {embedUrl ? (
          <iframe
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-700",
              pomodoroState === "focusing" && !isZenMaximized
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
        <button
          onClick={toggleZenMaximize}
          title={isZenMaximized ? "Thu nhỏ" : "Phóng to"}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 hover:scale-110"
        >
          <HugeiconsIcon icon={isZenMaximized ? Cancel01Icon : FullscreenIcon} size={14} />
        </button>
      </div>
    </div>
  );
}
