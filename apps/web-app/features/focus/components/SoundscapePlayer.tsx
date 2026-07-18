"use client";

import { useEffect, useRef } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";

export function SoundscapePlayer() {
  const { youtubeUrl, isZenFull, pomodoroState } = useFocusStore();
  const playerRef = useRef<any>(null);

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
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
    if (listId && videoId) {
      return `https://www.youtube.com/embed/${videoId}?list=${listId}&enablejsapi=1${originParam}`;
    } else if (listId) {
      return `https://www.youtube.com/embed/videoseries?list=${listId}&enablejsapi=1${originParam}`;
    } else if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?loop=1&playlist=${videoId}&enablejsapi=1${originParam}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  // Load YouTube IFrame API script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize/re-initialize player when embedUrl changes
  useEffect(() => {
    if (typeof window === "undefined" || !embedUrl) return;

    let active = true;
    let timeInterval: any = null;

    const initPlayer = () => {
      if (!active) return;
      const YT = (window as any).YT;
      if (!YT || !YT.Player) return;

      new YT.Player("soundscape-youtube-player-iframe", {
        events: {
          onReady: (event: any) => {
            if (!active) return;
            playerRef.current = event.target;
            
            // Set initial volume from store
            const storeVol = useFocusStore.getState().volume;
            event.target.setVolume(storeVol);

            // Sync duration and initial playing state
            const duration = event.target.getDuration() || 0;
            useFocusStore.getState().setDuration(duration);
            
            // Register player controls
            useFocusStore.getState().registerPlayerControls({
              play: () => {
                try { event.target.playVideo(); } catch {}
              },
              pause: () => {
                try { event.target.pauseVideo(); } catch {}
              },
              setVolume: (v: number) => {
                try { event.target.setVolume(v); } catch {}
              },
              seek: (t: number) => {
                try { event.target.seekTo(t, true); } catch {}
              },
              nextTrack: () => {
                try { event.target.nextVideo(); } catch {}
              },
              prevTrack: () => {
                try { event.target.previousVideo(); } catch {}
              }
            });

            const playerState = event.target.getPlayerState();
            useFocusStore.getState().setIsPlaying(playerState === 1);
          },
          onStateChange: (event: any) => {
            if (!active) return;
            const state = event.data;
            // state: 1 = playing, 2 = paused, 0 = ended, 3 = buffering
            const isPlaying = state === 1;
            useFocusStore.getState().setIsPlaying(isPlaying);
            
            if (state === 1) {
              const duration = event.target.getDuration() || 0;
              useFocusStore.getState().setDuration(duration);
              
              // Extract current video details if available
              if (event.target.getVideoData) {
                const data = event.target.getVideoData();
                useFocusStore.getState().setActiveVideoInfo(
                  data.title || "Unknown Title",
                  data.author || "Unknown Channel",
                  data.video_id || ""
                );
              }
            }

            // Auto-play next if ended
            if (state === 0) {
              const { isLooping, playNextSoundscape } = useFocusStore.getState();
              if (isLooping) {
                event.target.playVideo();
              } else {
                const playlist = event.target.getPlaylist();
                if (playlist && playlist.length > 1) {
                  event.target.nextVideo();
                } else {
                  playNextSoundscape();
                }
              }
            }
          }
        }
      });
    };

    const checkYT = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        setTimeout(checkYT, 100);
      }
    };

    checkYT();

    // Start polling for current time
    timeInterval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          useFocusStore.getState().setCurrentTime(currentTime);
        } catch {}
      }
    }, 500);

    return () => {
      active = false;
      clearInterval(timeInterval);
      useFocusStore.getState().registerPlayerControls(null);
    };
  }, [embedUrl]);

  return (
    <div className={cn(
      "shrink-0 transition-all duration-300",
      isZenFull ? "px-5 pt-5 pb-3" : "p-4 border-b border-border"
    )}>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-black transition-all duration-300",
          isZenFull 
            ? "rounded-2xl border border-border/30 shadow-[0_8px_40px_rgba(0,0,0,0.35)]" 
            : "rounded-xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] group cursor-pointer"
        )}
        style={{ 
          paddingBottom: isZenFull ? "min(56.25%, 62vh)" : "min(56.25%, 220px)" 
        }}
      >
        {!isZenFull && (
          <div
            className={cn(
              "absolute inset-0 transition-colors duration-500 pointer-events-none z-10",
              pomodoroState === "focusing"
                ? "bg-black/40 group-hover:bg-transparent"
                : "bg-transparent"
            )}
          />
        )}
        {embedUrl ? (
          <iframe
            id="soundscape-youtube-player-iframe"
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-700",
              (!isZenFull && pomodoroState === "focusing")
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
