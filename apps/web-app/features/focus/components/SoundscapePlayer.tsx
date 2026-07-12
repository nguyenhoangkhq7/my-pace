"use client";

import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";

export function SoundscapePlayer() {
  const { youtubeUrl, isZenFull, pomodoroState } = useFocusStore();

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

  if (isZenFull) {
    // ─── Zen Full mode: full-width video with 16:9 aspect ratio ──────────────
    // paddingBottom: "min(56.25%, 62vh)" gives a 16:9 ratio (56.25% = 9/16 × 100)
    // capped at 62% of viewport height so it never overwhelms the screen.
    return (
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-border/30 shadow-[0_8px_40px_rgba(0,0,0,0.35)] bg-black"
          style={{ paddingBottom: "min(56.25%, 62vh)" }}
        >
          {embedUrl ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
              Invalid YouTube URL
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Normal 3-column mode: compact video with padding-bottom ratio ────────────
  return (
    <div className="p-4 border-b border-border shrink-0">
      <div
        className="relative overflow-hidden border border-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-black group cursor-pointer transition-all duration-300 w-full rounded-xl"
        style={{ paddingBottom: "min(56.25%, 220px)" }}
      >
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-500 pointer-events-none z-10",
            pomodoroState === "focusing"
              ? "bg-black/40 group-hover:bg-transparent"
              : "bg-transparent"
          )}
        />
        {embedUrl ? (
          <iframe
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-700",
              pomodoroState === "focusing"
                ? "grayscale-[60%] group-hover:grayscale-0"
                : "grayscale-0"
            )}
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
            Invalid YouTube URL
          </div>
        )}
      </div>
    </div>
  );
}
