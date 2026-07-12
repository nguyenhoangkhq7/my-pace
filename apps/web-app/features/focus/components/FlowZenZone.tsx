"use client";

import { useState } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { SoundscapePlayer } from "./SoundscapePlayer";
import { SoundscapeAddForm } from "./SoundscapeAddForm";
import { SoundscapeHistoryItem } from "./SoundscapeHistoryItem";

export function FlowZenZone() {
  const { youtubeUrl, setYoutubeUrl, youtubeHistory, removeFromHistory } = useFocusStore();
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="h-full flex flex-col border-l border-border bg-background min-h-0 min-w-[220px]">
      {/* Top Half: YouTube Player */}
      <SoundscapePlayer />

      {/* Bottom Half: History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Soundscape</h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
          </button>
        </div>

        {isAdding && (
          <SoundscapeAddForm onCancel={() => setIsAdding(false)} />
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {youtubeHistory.length === 0 && !isAdding && (
            <div className="text-center text-xs font-medium text-muted-foreground py-6">
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
