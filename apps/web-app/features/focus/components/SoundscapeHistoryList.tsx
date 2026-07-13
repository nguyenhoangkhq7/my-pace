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
          ? "grid grid-rows-2 grid-flow-col auto-cols-[240px] sm:auto-cols-[280px] md:auto-cols-[320px] gap-4 overflow-x-auto overflow-y-hidden content-start"
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
          isPlaying={item.url === currentUrl}
          onPlay={() => onPlay(item.url)}
          onRemove={() => onRemove(item.url)}
          onRename={(newTitle) => onRename(item.url, newTitle)}
          layout={layoutMode}
        />
      ))}
    </div>
  );
}
