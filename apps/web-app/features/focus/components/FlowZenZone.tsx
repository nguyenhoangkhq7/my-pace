import { useState, useRef } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { YoutubeIcon, PlayIcon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";

export function FlowZenZone() {
  const { youtubeUrl, setYoutubeUrl, youtubeHistory, addToHistory, removeFromHistory } = useFocusStore();
  
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
    <div className="h-full flex flex-col border-l border-slate-800 bg-slate-950">
      {/* Top Half: YouTube Player */}
      <div className="p-4 border-b border-slate-800">
        <div className="bg-black aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-lg relative group cursor-pointer">
          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500 pointer-events-none z-10"></div>
          {embedUrl ? (
            <iframe
              className="w-full h-full grayscale-[80%] group-hover:grayscale-0 transition-all duration-500"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Invalid YouTube URL
            </div>
          )}
        </div>
      </div>

      {/* Bottom Half: History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 pb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved Playlists</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
          </button>
        </div>

        {isAdding && (
          <div className="px-4 pb-4">
            <form onSubmit={handleAddSubmit} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-3">
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube link..."
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                required
              />
              <input 
                type="text" 
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Title (e.g. Lofi Coding)..."
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1">
                  Cancel
                </button>
                <button type="submit" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded shadow">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {youtubeHistory.length === 0 && !isAdding && (
            <div className="text-center text-xs text-slate-500 py-4">
              No saved playlists yet.
            </div>
          )}
          {youtubeHistory.map((item, index) => {
            const isPlaying = item.url === youtubeUrl;
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2.5 rounded-xl border group transition-colors
                  ${isPlaying ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}
                `}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className={`text-sm truncate ${isPlaying ? 'text-indigo-300 font-medium' : 'text-slate-300'}`}>
                    {item.title}
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isPlaying && (
                    <button 
                      onClick={() => setYoutubeUrl(item.url)}
                      className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10"
                      title="Play"
                    >
                      <HugeiconsIcon icon={PlayIcon} size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => removeFromHistory(item.url)}
                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10"
                    title="Remove"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
                {isPlaying && (
                  <div className="shrink-0 flex space-x-0.5 px-1 group-hover:hidden">
                    <div className="w-1 h-3 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                    <div className="w-1 h-2 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]"></div>
                    <div className="w-1 h-3.5 bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]"></div>
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
