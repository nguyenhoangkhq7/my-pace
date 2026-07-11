"use client";

import React, { useState } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";

interface SoundscapeAddFormProps {
  onCancel: () => void;
}

export function SoundscapeAddForm({ onCancel }: SoundscapeAddFormProps) {
  const { setYoutubeUrl, addToHistory } = useFocusStore();
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    let title = inputTitle.trim();
    if (!title) {
      const { videoId, listId } = parseYouTubeUrl(inputUrl);
      title = listId ? `Playlist ${listId.slice(0, 5)}` : videoId ? `Video ${videoId}` : "Unknown Stream";
    }

    addToHistory(inputUrl, title);
    setYoutubeUrl(inputUrl);
    setInputUrl("");
    setInputTitle("");
    onCancel();
  };

  return (
    <div className="px-4 pb-4">
      <form onSubmit={handleSubmit} className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-inner">
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
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded shadow"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
