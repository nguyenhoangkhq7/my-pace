import { SoundscapeHistoryItem } from "./SoundscapeHistoryItem";
import { cn } from "@/lib/utils";

interface SoundscapeItem {
  url: string;
  title: string;
}

interface SoundscapeHistoryListProps {
  history: SoundscapeItem[];
  isAdding: boolean;
  layoutMode: "list" | "grid";
  currentUrl: string | null;
  onPlay: (url: string) => void;
  onRemove: (url: string) => void;
  onRename: (url: string, newTitle: string) => void;
  isZenFull?: boolean;
}

function isSameYouTubeSource(url1: string | null, url2: string | null): boolean {
  if (!url1 || !url2) return false;

  const parse = (url: string) => {
    const vidRegExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
    const vidMatch = url.match(vidRegExp);
    const videoId = vidMatch && vidMatch[2].length === 11 ? vidMatch[2] : null;

    const listRegExp = /[?&]list=([^#&?]+)/;
    const listMatch = url.match(listRegExp);
    let listId = listMatch ? listMatch[1] : null;

    // Filter private lists for matching purposes too
    if (listId === "LL" || listId === "WL") {
      listId = null;
    }

    return { videoId, listId };
  };

  const p1 = parse(url1);
  const p2 = parse(url2);

  // If both have playlist listId and they match, they are from the same playlist source
  if (p1.listId && p2.listId && p1.listId === p2.listId) {
    return true;
  }

  // If not in a playlist, compare videoId
  if (p1.videoId && p2.videoId && p1.videoId === p2.videoId) {
    return true;
  }

  return false;
}

export function SoundscapeHistoryList({
  history,
  isAdding,
  layoutMode,
  currentUrl,
  onPlay,
  onRemove,
  onRename,
  isZenFull,
}: SoundscapeHistoryListProps) {
  return (
    <div
      className={cn(
        "flex-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        isZenFull ? "px-6 py-3" : "px-4 pb-4",
        layoutMode === "grid"
          ? "grid grid-rows-[repeat(2,auto)] grid-flow-col auto-cols-[240px] sm:auto-cols-[280px] md:auto-cols-[320px] gap-4 overflow-x-auto overflow-y-hidden content-start"
          : "overflow-y-auto space-y-2"
      )}
    >
      {history.length === 0 && !isAdding && (
        <div className="text-center text-xs font-medium text-muted-foreground py-6 col-span-full">
          No saved playlists yet.
        </div>
      )}
      {history.map((item) => (
        <SoundscapeHistoryItem
          key={item.url}
          title={item.title}
          url={item.url}
          isPlaying={isSameYouTubeSource(item.url, currentUrl)}
          onPlay={() => onPlay(item.url)}
          onRemove={() => onRemove(item.url)}
          onRename={(newTitle) => onRename(item.url, newTitle)}
          layout={layoutMode}
        />
      ))}
    </div>
  );
}
