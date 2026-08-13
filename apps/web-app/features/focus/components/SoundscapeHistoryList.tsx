import { useMemo, useState } from "react";
import { SoundscapeHistoryItem } from "./SoundscapeHistoryItem";
import { cn } from "@/lib/utils";
import { useFocusStore } from "@/features/focus/store/focus.store";

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

function parseYouTube(url: string | null) {
  if (!url) return { videoId: null, listId: null };
  const vidRegExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const vidMatch = url.match(vidRegExp);
  const videoId = vidMatch && vidMatch[2].length === 11 ? vidMatch[2] : null;

  const listRegExp = /[?&]list=([^#&?]+)/;
  const listMatch = url.match(listRegExp);
  let listId = listMatch ? listMatch[1] : null;

  if (listId === "LL" || listId === "WL") listId = null;

  return { videoId, listId };
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
  const currentParsed = useMemo(() => parseYouTube(currentUrl), [currentUrl]);
  const reorderHistory = useFocusStore((s) => s.reorderHistory);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/my-pace-soundscape-reorder", index.toString());
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragTargetIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragTargetIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragTargetIndex === index) {
      setDragTargetIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderHistory(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragTargetIndex(null);
  };

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
      {history.map((item, index) => {
        const itemParsed = parseYouTube(item.url);
        const isPlaying =
          (currentParsed.listId && itemParsed.listId && currentParsed.listId === itemParsed.listId) ||
          (currentParsed.videoId && itemParsed.videoId && currentParsed.videoId === itemParsed.videoId);

        return (
          <SoundscapeHistoryItem
            key={item.url}
            title={item.title}
            url={item.url}
            isPlaying={!!isPlaying}
            onPlay={() => onPlay(item.url)}
            onRemove={() => onRemove(item.url)}
            onRename={(newTitle) => onRename(item.url, newTitle)}
            layout={layoutMode}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={(e) => handleDragLeave(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            isDragTarget={dragTargetIndex === index}
          />
        );
      })}
    </div>
  );
}
