"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface SoundscapeHistoryItemProps {
  title: string;
  url: string;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

export function SoundscapeHistoryItem({
  title,
  isPlaying,
  onPlay,
  onRemove,
}: SoundscapeHistoryItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border group transition-all",
        isPlaying
          ? "bg-card border-indigo-500/55 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
          : "bg-card border-border hover:border-border/80 hover:bg-muted"
      )}
    >
      <div className="flex-1 min-w-0 pr-3">
        <div
          className={cn(
            "text-sm truncate tracking-wide",
            isPlaying ? "text-indigo-300 font-bold" : "text-foreground font-medium"
          )}
        >
          {title}
        </div>
      </div>
      <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isPlaying && (
          <button
            onClick={onPlay}
            className="text-muted-foreground hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors"
            title="Play"
          >
            <HugeiconsIcon icon={PlayIcon} size={16} />
          </button>
        )}
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Remove"
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </button>
      </div>
      {isPlaying && (
        <div className="shrink-0 flex items-end space-x-0.5 px-1 h-3 group-hover:hidden">
          <div className="w-[3px] h-2 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
          <div className="w-[3px] h-3 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]" />
          <div className="w-[3px] h-2.5 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]" />
        </div>
      )}
    </div>
  );
}
