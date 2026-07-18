"use client";

import { useEffect, useRef } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";

// ─── YouTube IFrame API Types ────────────────────────────────────────────────

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  getVideoData: () => { title: string; author: string; video_id: string };
  getPlaylist: () => string[] | null;
  loadVideoById: (videoId: string) => void;
  loadPlaylist: (opts: { list: string; listType: string }) => void;
  cuePlaylist: (opts: { list: string; listType: string }) => void;
  cueVideoById: (videoId: string) => void;
  playVideoAt: (index: number) => void;
}

interface YTReadyEvent {
  target: YTPlayer;
}

interface YTStateChangeEvent {
  data: number;
  target: YTPlayer;
}

interface WindowWithYT extends Window {
  YT?: {
    Player: new (elementId: string | HTMLElement, options: unknown) => YTPlayer;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
  };
  onYouTubeIframeAPIReady?: () => void;
}

// ─── URL Parser ──────────────────────────────────────────────────────────────

function parseYouTubeUrl(url: string): { videoId: string | null; listId: string | null } {
  const vidRegExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const vidMatch = url.match(vidRegExp);
  const videoId = vidMatch && vidMatch[2].length === 11 ? vidMatch[2] : null;

  const listRegExp = /[?&]list=([^#&?]+)/;
  const listMatch = url.match(listRegExp);
  const listId = listMatch ? listMatch[1] : null;

  return { videoId, listId };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SoundscapePlayer() {
  const { youtubeUrl, isZenFull, pomodoroState } = useFocusStore();
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the last loaded URL to avoid reloading the same content
  const lastUrlRef = useRef<string>("");
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayerReadyRef = useRef(false);
  // Guard flag + timer to suppress auto-advance while a new URL is loading.
  // Problem: when loadPlaylist/loadVideoById is called, YouTube fires state=1
  // almost immediately (before the new video actually renders), then fires a
  // delayed state=0 for the OLD video. If we clear the flag on state=1, the
  // delayed state=0 triggers nextVideo() and skips the new first track.
  // Solution: use a 2-second timeout so the flag stays true long enough to
  // absorb any stale state=0 events from the previous video.
  const isLoadingNewUrlRef = useRef(false);
  const loadingGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the specific video we want to play within a cued playlist.
  const pendingVideoIdRef = useRef<string | null>(null);

  const { videoId, listId } = parseYouTubeUrl(youtubeUrl);

  /**
   * Load content into the existing player instance without destroying it.
   * Priority: listId > videoId — this preserves playlist context for next/prev navigation.
   *
   * For Radio/Mix playlists (?v=X&list=RDX): loadPlaylist starts from index 0
   * which is always the seed video X. The seed video issue was caused by initial
   * player creation not including `list` context — that is now fixed separately.
   *
   * For regular playlists (?v=X&list=PLyyy): loadPlaylist starts from index 0
   * of the playlist and navigation is fully functional.
   *
   * For single videos (?v=X only): loadVideoById loads exactly that video.
   */
  const loadUrlIntoPlayer = (player: YTPlayer, url: string) => {
    const { videoId: vid, listId: lid } = parseYouTubeUrl(url);
    try {
      if (loadingGuardTimerRef.current) clearTimeout(loadingGuardTimerRef.current);
      isLoadingNewUrlRef.current = true;
      
      if (vid && lid) {
        // We have BOTH a specific video AND a playlist context.
        // We must cue the playlist first, wait for it to load, find the index, 
        // and then play the specific video. This is the only way to get both.
        pendingVideoIdRef.current = vid;
        player.cuePlaylist({ list: lid, listType: "playlist" });
        // The rest happens in onStateChange(5)
      } else if (lid) {
        // Pure playlist URL — load from index 0.
        player.loadPlaylist({ list: lid, listType: "playlist" });
        // Auto-disarm guard after 2s
        loadingGuardTimerRef.current = setTimeout(() => {
          isLoadingNewUrlRef.current = false;
          loadingGuardTimerRef.current = null;
        }, 2000);
      } else if (vid) {
        // Single video URL — no playlist context needed.
        player.loadVideoById(vid);
        loadingGuardTimerRef.current = setTimeout(() => {
          isLoadingNewUrlRef.current = false;
          loadingGuardTimerRef.current = null;
        }, 2000);
      }
    } catch {
      // Silently fail — player may not be fully ready
      isLoadingNewUrlRef.current = false;
      if (loadingGuardTimerRef.current) {
        clearTimeout(loadingGuardTimerRef.current);
        loadingGuardTimerRef.current = null;
      }
    }
  };

  // ── Step 1: Inject YouTube IFrame API script ONCE ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as WindowWithYT;
    if (win.YT?.Player) return; // Already loaded

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // ── Step 2: Create the YT.Player instance ONCE when the container is ready ─
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let active = true;

    const registerControls = (player: YTPlayer) => {
      useFocusStore.getState().registerPlayerControls({
        play: () => { try { player.playVideo(); } catch {} },
        pause: () => { try { player.pauseVideo(); } catch {} },
        setVolume: (v: number) => { try { player.setVolume(v); } catch {} },
        seek: (t: number) => { try { player.seekTo(t, true); } catch {} },
        nextTrack: () => { try { player.nextVideo(); } catch {} },
        prevTrack: () => { try { player.previousVideo(); } catch {} },
      });
    };

    const startPolling = (player: YTPlayer) => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== "function") return;
        try {
          useFocusStore.getState().setCurrentTime(player.getCurrentTime() || 0);
        } catch {}
      }, 500);
    };

    const createPlayer = () => {
      if (!active || !containerRef.current) return;
      const win = window as WindowWithYT;
      if (!win.YT?.Player) return;

      // Determine initial video/list from the current youtubeUrl
      const { videoId: initVid, listId: initList } = parseYouTubeUrl(
        useFocusStore.getState().youtubeUrl
      );
      const origin = window.location.origin;

      // Build initial playerVars
      // Always include list context when available so next/prev track works.
      // When both videoId and listId are present (e.g. Radio playlists),
      // the YT Player constructor uses videoId as the starting point
      // while list/listType provide the playlist navigation context.
      const playerVars: Record<string, unknown> = {
        autoplay: 1,
        enablejsapi: 1,
        origin,
        rel: 0,
      };
      if (initList) {
        playerVars.listType = "playlist";
        playerVars.list = initList;
      }

      new win.YT.Player(containerRef.current!, {
        width: "100%",
        height: "100%",
        videoId: initVid || undefined,
        playerVars,
        events: {
          onReady: (event: YTReadyEvent) => {
            if (!active) return;
            playerRef.current = event.target;
            isPlayerReadyRef.current = true;
            lastUrlRef.current = useFocusStore.getState().youtubeUrl;

            // Apply stored volume
            const vol = useFocusStore.getState().volume;
            event.target.setVolume(vol);

            // Sync duration
            const dur = event.target.getDuration() || 0;
            useFocusStore.getState().setDuration(dur);

            // Register controls immediately so ControllerBar works right away
            registerControls(event.target);

            // Auto-play if store says so
            if (useFocusStore.getState().isPlaying) {
              try { event.target.playVideo(); } catch {}
            }

            // Start time polling
            startPolling(event.target);
          },

          onStateChange: (event: YTStateChangeEvent) => {
            if (!active) return;
            const state = event.data;
            const isPlaying = state === 1; // YT.PlayerState.PLAYING
            useFocusStore.getState().setIsPlaying(isPlaying);

            if (state === 5) { // YT.PlayerState.CUED
              if (pendingVideoIdRef.current) {
                const targetVid = pendingVideoIdRef.current;
                pendingVideoIdRef.current = null; // Clear it so we only do this once
                
                const playlist = event.target.getPlaylist();
                const index = playlist ? playlist.indexOf(targetVid) : -1;
                
                if (index !== -1) {
                  // Found the exact video in the cued playlist! Play it.
                  event.target.playVideoAt(index);
                } else {
                  // Video is not in the loaded playlist chunk, fallback to direct load.
                  // (This loses playlist context, but guarantees the correct video plays).
                  event.target.loadVideoById(targetVid);
                }
                
                // Now start the 2-second auto-advance guard timer since playback is initiated
                if (loadingGuardTimerRef.current) clearTimeout(loadingGuardTimerRef.current);
                loadingGuardTimerRef.current = setTimeout(() => {
                  isLoadingNewUrlRef.current = false;
                  loadingGuardTimerRef.current = null;
                }, 2000);
              }
            }

            if (state === 1) {
              // NOTE: Do NOT clear isLoadingNewUrlRef here.
              // state=1 fires almost immediately when a new playlist starts loading
              // (before the first track actually renders). Clearing the flag here
              // would re-enable state=0 auto-advance too early.
              // The guard timer in loadUrlIntoPlayer handles the cleanup after 2 s.

              // Update duration when playback starts (needed for playlists where
              // duration changes between tracks)
              const dur = event.target.getDuration() || 0;
              useFocusStore.getState().setDuration(dur);

              // Sync video metadata
              if (event.target.getVideoData) {
                const data = event.target.getVideoData();
                useFocusStore.getState().setActiveVideoInfo(
                  data.title || "Unknown Title",
                  data.author || "Unknown Channel",
                  data.video_id || ""
                );
              }
            }

            // When a video inside a playlist ends, update duration for next track
            if (state === 3) {
              // Buffering — the track likely just changed; update duration shortly
              setTimeout(() => {
                if (!playerRef.current) return;
                try {
                  const dur = playerRef.current.getDuration() || 0;
                  useFocusStore.getState().setDuration(dur);
                } catch {}
              }, 800);
            }

            // Auto-play next soundscape if a single video ends.
            // Skip this entire block while a new URL is being loaded — the state=0
            // could be the previous video ending during the transition, not a
            // genuine end-of-content event.
            if (state === 0 && !isLoadingNewUrlRef.current) {
              const { isLooping, playNextSoundscape } = useFocusStore.getState();
              if (isLooping) {
                try { event.target.playVideo(); } catch {}
              } else {
                const playlist = event.target.getPlaylist();
                if (playlist && playlist.length > 1) {
                  try { event.target.nextVideo(); } catch {}
                } else {
                  playNextSoundscape();
                }
              }
            }
          },
        },
      });
    };

    // Wait for YT API to be ready before creating the player
    const tryCreate = () => {
      const win = window as WindowWithYT;
      if (win.YT?.Player) {
        createPlayer();
      } else {
        // Hook into the global callback if API isn't ready yet
        const prev = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
          prev?.();
          createPlayer();
        };
      }
    };

    tryCreate();

    return () => {
      active = false;
      isPlayerReadyRef.current = false;
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      if (loadingGuardTimerRef.current) clearTimeout(loadingGuardTimerRef.current);
      // Keep playerControls registered so ControllerBar stays functional
      // Only clear on full unmount (component removed from DOM)
      useFocusStore.getState().registerPlayerControls(null);
      playerRef.current = null;
    };
  }, []); // ← intentionally run only ONCE

  // ── Step 3: When youtubeUrl changes, load the new content into the SAME player
  useEffect(() => {
    if (!isPlayerReadyRef.current || !playerRef.current) return;
    if (lastUrlRef.current === youtubeUrl) return; // No change
    lastUrlRef.current = youtubeUrl;

    loadUrlIntoPlayer(playerRef.current, youtubeUrl);
    // Reset time display immediately (store already reset by setYoutubeUrl)
  }, [youtubeUrl]);

  // ── Step 4: Sync volume changes from store to the player ──────────────────
  useEffect(() => {
    if (!playerRef.current || !isPlayerReadyRef.current) return;
    try { playerRef.current.setVolume(useFocusStore.getState().volume); } catch {}
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasValidUrl = !!(videoId || listId);

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
        {/* Focus-mode overlay */}
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

        {hasValidUrl ? (
          /* This div is replaced in-place by new YT.Player() — DO NOT give it an id that
             conflicts with other elements. The YT API will insert an <iframe> here. */
          <div
            ref={containerRef}
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-700",
              (!isZenFull && pomodoroState === "focusing")
                ? "grayscale-[60%] group-hover:grayscale-0"
                : "grayscale-0"
            )}
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
