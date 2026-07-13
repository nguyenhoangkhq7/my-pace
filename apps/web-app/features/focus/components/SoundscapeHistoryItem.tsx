"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface SoundscapeHistoryItemProps {
  title: string;
  url: string;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onRename?: (newTitle: string) => void;
  layout?: "list" | "grid";
}

export function SoundscapeHistoryItem({
  title,
  url,
  isPlaying,
  onPlay,
  onRemove,
  onRename,
  layout = "list",
}: SoundscapeHistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const handleRenameSubmit = () => {
    if (editValue.trim() && editValue.trim() !== title && onRename) {
      onRename(editValue.trim());
    } else {
      setEditValue(title); // revert
    }
    setIsEditing(false);
  };
  const getThumbnail = () => {
    const vidMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/);
    if (vidMatch && vidMatch[2].length === 11) {
      return `https://i.ytimg.com/vi/${vidMatch[2]}/mqdefault.jpg`;
    }
    return null;
  };

  if (layout === "grid") {
    const thumb = getThumbnail();
    return (
      <div 
        className={cn("relative flex flex-col h-full w-full group rounded-xl overflow-hidden border transition-all cursor-pointer", isPlaying ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-border hover:border-border/80")} 
        onClick={onPlay}
      >
        <div className="relative w-full pt-[56.25%] bg-muted shrink-0">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><HugeiconsIcon icon={PlayIcon} /></div>
          )}
          
          {isPlaying && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
               <div className="flex items-end space-x-1 px-1 h-5">
                  <div className="w-[3px] h-3 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                  <div className="w-[3px] h-5 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]" />
                  <div className="w-[3px] h-4 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]" />
               </div>
            </div>
          )}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-10 h-10 bg-indigo-500/90 rounded-full flex items-center justify-center text-white shadow-lg"><HugeiconsIcon icon={PlayIcon} size={20} /></div>
            </div>
          )}
        </div>
        <div className="flex-1 p-2.5 bg-card flex flex-col justify-center relative group/title min-w-0">
          {isEditing ? (
            <input 
              autoFocus 
              value={editValue} 
              onChange={e => setEditValue(e.target.value)} 
              onBlur={handleRenameSubmit}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') { setEditValue(title); setIsEditing(false); } }}
              className="text-xs font-medium w-full bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <>
               <div className={cn("text-xs truncate tracking-wide pr-6", isPlaying ? "text-indigo-300 font-bold" : "text-foreground font-medium")} title={title}>{title}</div>
               {onRename && (
                 <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-100 text-muted-foreground hover:text-primary transition-opacity shrink-0">
                   <Pencil size={12} />
                 </button>
               )}
            </>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }} 
          className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border group transition-all",
        isPlaying
          ? "bg-card border-indigo-500/55 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
          : "bg-card border-border hover:border-border/80 hover:bg-muted"
      )}
    >
      <div className="flex-1 min-w-0 pr-3 relative group/title flex items-center">
        {isEditing ? (
          <input 
             autoFocus 
             value={editValue} 
             onChange={e => setEditValue(e.target.value)} 
             onBlur={handleRenameSubmit}
             onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') { setEditValue(title); setIsEditing(false); } }}
             className="text-sm font-medium w-full bg-background border border-border rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <>
            <div
              className={cn(
                "text-sm truncate tracking-wide",
                isPlaying ? "text-indigo-300 font-bold" : "text-foreground font-medium"
              )}
            >
              {title}
            </div>
            {onRename && (
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="ml-2 opacity-0 group-hover/title:opacity-100 text-muted-foreground hover:text-primary transition-opacity shrink-0">
                <Pencil size={14} />
              </button>
            )}
          </>
        )}
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
