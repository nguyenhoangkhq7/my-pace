import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PomodoroState = "idle" | "focusing" | "breaking" | "finished" | "paused";

function isSameYouTubeSource(url1: string | null, url2: string | null): boolean {
  if (!url1 || !url2) return false;

  const parse = (url: string) => {
    const vidRegExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
    const vidMatch = url.match(vidRegExp);
    const videoId = vidMatch && vidMatch[2].length === 11 ? vidMatch[2] : null;

    const listRegExp = /[?&]list=([^#&?]+)/;
    const listMatch = url.match(listRegExp);
    let listId = listMatch ? listMatch[1] : null;

    if (listId === "LL" || listId === "WL") {
      listId = null;
    }

    return { videoId, listId };
  };

  const p1 = parse(url1);
  const p2 = parse(url2);

  if (p1.listId && p2.listId && p1.listId === p2.listId) {
    return true;
  }

  if (p1.videoId && p2.videoId && p1.videoId === p2.videoId) {
    return true;
  }

  return false;
}

interface FocusState {
  // Session config
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  
  // Current active task
  activeTaskId: string | null;
  activePlanTaskId: string | null;
  activeTaskEstimatedMinutes: number;
  
  // Pomodoro runtime state
  pomodoroState: PomodoroState;
  timeLeft: number; // in seconds
  currentSession: number;
  totalSessions: number;
  
  // Accumulated time for the current task (in seconds)
  accumulatedFocusTime: number;
  lastActiveTimestamp: number;

  // Widget settings (persisted)
  youtubeUrl: string;
  youtubeHistory: { url: string; title: string }[];

  // Soundscape Playback State (not persisted except volume & looping)
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  isShuffle: boolean;
  activeVideoTitle: string;
  activeVideoAuthor: string;
  activeVideoId: string;

  // Modal control
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Zen Zone full mode (auto-triggered when panel dragged >= 65%)
  isZenFull: boolean;
  setZenFull: (value: boolean) => void;

  // Flow Fullscreen mode
  isFlowFullscreen: boolean;
  toggleFlowFullscreen: () => void;

  // Video Background mode (plays YouTube soundscape video as full viewport background)
  isVideoBackground: boolean;
  videoBgOpacity: number; // 10 to 95
  videoBgBlur: number; // 0 to 10
  toggleVideoBackground: () => void;
  setVideoBgOpacity: (opacity: number) => void;
  setVideoBgBlur: (blur: number) => void;

  // Completion prompt state (micro-modal)
  promptTask: { id: string; title: string; estimatedMinutes: number } | null;
  setPromptTask: (task: { id: string; title: string; estimatedMinutes: number } | null) => void;

  // Floating Pomodoro widget state
  isPomodoroFloating: boolean;
  setPomodoroFloating: (value: boolean) => void;

  // Actions
  setYoutubeUrl: (url: string) => void;
  addToHistory: (url: string, title: string) => void;
  removeFromHistory: (url: string) => void;
  updateHistoryTitle: (url: string, newTitle: string) => void;
  openFocusMode: (taskId: string, planTaskId: string, estimatedMinutes: number, alreadyWorkedMinutes?: number) => void;
  closeFocusMode: () => void;

  // Playback Control Actions
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setIsLooping: (isLooping: boolean) => void;
  setIsShuffle: (isShuffle: boolean) => void;
  setActiveVideoInfo: (title: string, author: string, id: string) => void;

  // Global Player instance reference registration
  playerControls: {
    play: () => void;
    pause: () => void;
    setVolume: (v: number) => void;
    seek: (t: number) => void;
    nextTrack: () => void;
    prevTrack: () => void;
  } | null;
  registerPlayerControls: (controls: FocusState["playerControls"]) => void;

  playNextSoundscape: () => void;
  playPrevSoundscape: () => void;
  
  // Timer Actions (called by usePomodoro hook)
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: (previousState: "focusing" | "breaking") => void;
  tick: (seconds: number) => void;
  transitionToBreak: () => void;
  transitionToFocus: () => void;
  completeAllSessions: () => void;
  updateConfig: (focusMin: number, breakMin: number, sound: boolean) => void;
  adjustForElapsedTime: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      focusMinutes: 25,
      breakMinutes: 5,
      soundEnabled: true,
      
      activeTaskId: null,
      activePlanTaskId: null,
      activeTaskEstimatedMinutes: 25,
      pomodoroState: "idle",
      timeLeft: 0,
      currentSession: 1,
      totalSessions: 1,
      accumulatedFocusTime: 0,
      lastActiveTimestamp: 0,
      
      youtubeUrl: "https://www.youtube.com/live/X4VbdwhkE10?si=gV884ky2WVfhPwQQ",
      youtubeHistory: [
        { url: "https://www.youtube.com/live/X4VbdwhkE10?si=gV884ky2WVfhPwQQ", title: "Lofi Girl" }
      ],

      isPlaying: false,
      volume: 50,
      currentTime: 0,
      duration: 0,
      isLooping: false,
      isShuffle: false,
      activeVideoTitle: "Lofi Girl",
      activeVideoAuthor: "Lofi Girl",
      activeVideoId: "X4VbdwhkE10",

      isSettingsOpen: false,
      isZenFull: false,
      isFlowFullscreen: false,
      promptTask: null,
      isPomodoroFloating: false,

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => {
        set({ volume });
        const { playerControls } = get();
        if (playerControls) playerControls.setVolume(volume);
      },
      setCurrentTime: (currentTime) => {
        if (Math.abs(get().currentTime - currentTime) >= 0.4) {
          set({ currentTime });
        }
      },
      setDuration: (duration) => set({ duration }),
      setIsLooping: (isLooping) => set({ isLooping }),
      setIsShuffle: (isShuffle) => set({ isShuffle }),
      setActiveVideoInfo: (title, author, id) => set({ activeVideoTitle: title, activeVideoAuthor: author, activeVideoId: id }),

      playerControls: null,
      registerPlayerControls: (controls) => set({ playerControls: controls }),

      playNextSoundscape: () => {
        const { youtubeUrl, youtubeHistory, setYoutubeUrl } = get();
        if (youtubeHistory.length === 0) return;
        const index = youtubeHistory.findIndex(item => isSameYouTubeSource(item.url, youtubeUrl));
        let nextIndex = 0;
        if (index !== -1) {
          nextIndex = (index + 1) % youtubeHistory.length;
        }
        setYoutubeUrl(youtubeHistory[nextIndex].url);
      },

      playPrevSoundscape: () => {
        const { youtubeUrl, youtubeHistory, setYoutubeUrl } = get();
        if (youtubeHistory.length === 0) return;
        const index = youtubeHistory.findIndex(item => isSameYouTubeSource(item.url, youtubeUrl));
        let prevIndex = youtubeHistory.length - 1;
        if (index !== -1) {
          prevIndex = (index - 1 + youtubeHistory.length) % youtubeHistory.length;
        }
        setYoutubeUrl(youtubeHistory[prevIndex].url);
      },

      setPomodoroFloating: (value) => set({ isPomodoroFloating: value }),
      setPromptTask: (task) => set({ promptTask: task }),
      setYoutubeUrl: (url) => {
        const vidRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
        const vidMatch = url.match(vidRegExp);
        const videoId = (vidMatch && vidMatch[2].length === 11) ? vidMatch[2] : "";

        const historyItem = get().youtubeHistory.find(item => item.url === url);
        const title = historyItem ? historyItem.title : "";
        
        set({ 
          youtubeUrl: url,
          isPlaying: true,
          activeVideoTitle: title || "Loading...",
          activeVideoAuthor: title ? "My Pace Player" : "",
          activeVideoId: videoId,
          // Reset playback state for the new video to avoid stale duration/time
          currentTime: 0,
          duration: 0,
        });
      },
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setZenFull: (value) => set({ isZenFull: value }),
      toggleFlowFullscreen: () => set((state) => ({ isFlowFullscreen: !state.isFlowFullscreen })),
      isVideoBackground: false,
      videoBgOpacity: 75,
      videoBgBlur: 2,
      toggleVideoBackground: () => set((state) => ({ isVideoBackground: !state.isVideoBackground })),
      setVideoBgOpacity: (opacity) => set({ videoBgOpacity: opacity }),
      setVideoBgBlur: (blur) => set({ videoBgBlur: blur }),
      
      addToHistory: (url, title) => set((state) => {
        // Prevent duplicates
        const exists = state.youtubeHistory.some(item => item.url === url);
        if (exists) return state;
        return { youtubeHistory: [{ url, title }, ...state.youtubeHistory] };
      }),

      removeFromHistory: (url) => set((state) => ({
        youtubeHistory: state.youtubeHistory.filter(item => item.url !== url)
      })),

      updateHistoryTitle: (url, newTitle) => set((state) => ({
        youtubeHistory: state.youtubeHistory.map(item => 
          item.url === url ? { ...item, title: newTitle } : item
        )
      })),
      
      openFocusMode: (taskId, planTaskId, estimatedMinutes, alreadyWorkedMinutes = 0) => {
        const { focusMinutes } = get();
        // Calculate total sessions and current session index based on total estimated time
        const totalSessions = Math.max(1, Math.ceil(estimatedMinutes / focusMinutes));
        const currentSession = Math.min(totalSessions, Math.floor(alreadyWorkedMinutes / focusMinutes) + 1);
        
        set({
          activeTaskId: taskId,
          activePlanTaskId: planTaskId,
          activeTaskEstimatedMinutes: estimatedMinutes,
          pomodoroState: "idle",
          currentSession,
          totalSessions,
          timeLeft: focusMinutes * 60,
          accumulatedFocusTime: alreadyWorkedMinutes * 60,
          lastActiveTimestamp: Date.now()
        });
      },

      closeFocusMode: () => {
        set({
          activeTaskId: null,
          activePlanTaskId: null,
          pomodoroState: "idle",
          lastActiveTimestamp: 0
        });
      },

      startTimer: () => {
        const { pomodoroState } = get();
        if (pomodoroState === "idle" || pomodoroState === "paused") {
          set({ pomodoroState: "focusing", lastActiveTimestamp: Date.now() });
        } else if (pomodoroState === "breaking") {
          set({ pomodoroState: "breaking", lastActiveTimestamp: Date.now() });
        }
      },

      pauseTimer: () => {
        set({ pomodoroState: "paused", lastActiveTimestamp: Date.now() });
      },

      resumeTimer: (previousState) => {
        set({ pomodoroState: previousState, lastActiveTimestamp: Date.now() });
      },

      tick: (seconds) => {
        set((state) => {
          let newAccumulated = state.accumulatedFocusTime;
          if (state.pomodoroState === "focusing") {
            newAccumulated += seconds;
          }
          return { 
            timeLeft: Math.max(0, state.timeLeft - seconds),
            accumulatedFocusTime: newAccumulated,
            lastActiveTimestamp: Date.now()
          };
        });
      },

      transitionToBreak: () => {
        const { breakMinutes, pomodoroState, timeLeft } = get();
        const addedFocus = pomodoroState === "focusing" ? timeLeft : 0;
        set((state) => ({
          pomodoroState: "breaking",
          timeLeft: breakMinutes * 60,
          accumulatedFocusTime: state.accumulatedFocusTime + addedFocus,
          lastActiveTimestamp: Date.now()
        }));
      },

      transitionToFocus: () => {
        const { focusMinutes, currentSession } = get();
        set({
          pomodoroState: "focusing",
          timeLeft: focusMinutes * 60,
          currentSession: currentSession + 1,
          lastActiveTimestamp: Date.now()
        });
      },

      completeAllSessions: () => {
        const { pomodoroState, timeLeft } = get();
        const addedFocus = pomodoroState === "focusing" ? timeLeft : 0;
        set((state) => ({
          pomodoroState: "finished",
          timeLeft: 0,
          accumulatedFocusTime: state.accumulatedFocusTime + addedFocus,
          lastActiveTimestamp: Date.now()
        }));
      },

      updateConfig: (focusMin, breakMin, sound) => {
        const { activeTaskId, activeTaskEstimatedMinutes, accumulatedFocusTime, pomodoroState } = get();
        
        let newTotalSessions = get().totalSessions;
        let newCurrentSession = get().currentSession;
        let newTimeLeft = get().timeLeft;
        
        if (activeTaskId) {
          newTotalSessions = Math.max(1, Math.ceil(activeTaskEstimatedMinutes / focusMin));
          const alreadyWorkedMinutes = Math.floor(accumulatedFocusTime / 60);
          newCurrentSession = Math.min(newTotalSessions, Math.floor(alreadyWorkedMinutes / focusMin) + 1);
          
          if (pomodoroState === "idle") {
            newTimeLeft = focusMin * 60;
          } else if (pomodoroState === "paused" || pomodoroState === "focusing") {
            const diffSec = (focusMin - get().focusMinutes) * 60;
            newTimeLeft = Math.max(0, newTimeLeft + diffSec);
          } else if (pomodoroState === "breaking") {
            const diffSec = (breakMin - get().breakMinutes) * 60;
            newTimeLeft = Math.max(0, newTimeLeft + diffSec);
          }
        } else {
          newTimeLeft = focusMin * 60;
        }

        set({
          focusMinutes: focusMin,
          breakMinutes: breakMin,
          soundEnabled: sound,
          totalSessions: newTotalSessions,
          currentSession: newCurrentSession,
          timeLeft: newTimeLeft,
        });
      },

      adjustForElapsedTime: () => {
        const { pomodoroState, timeLeft, lastActiveTimestamp, accumulatedFocusTime } = get();
        if ((pomodoroState === "focusing" || pomodoroState === "breaking") && lastActiveTimestamp > 0) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastActiveTimestamp) / 1000);
          if (elapsedSeconds > 0) {
            if (timeLeft - elapsedSeconds <= 0) {
              const remainingFocus = pomodoroState === "focusing" ? timeLeft : 0;
              if (pomodoroState === "focusing") {
                const { currentSession, totalSessions } = get();
                if (currentSession >= totalSessions) {
                  set({
                    pomodoroState: "finished",
                    timeLeft: 0,
                    accumulatedFocusTime: accumulatedFocusTime + remainingFocus,
                    lastActiveTimestamp: now
                  });
                } else {
                  const { breakMinutes } = get();
                  set({
                    pomodoroState: "paused",
                    timeLeft: breakMinutes * 60,
                    accumulatedFocusTime: accumulatedFocusTime + remainingFocus,
                    lastActiveTimestamp: now
                  });
                }
              } else {
                const { focusMinutes } = get();
                set({
                  pomodoroState: "paused",
                  timeLeft: focusMinutes * 60,
                  lastActiveTimestamp: now
                });
              }
            } else {
              const addedFocus = pomodoroState === "focusing" ? elapsedSeconds : 0;
              set({
                timeLeft: timeLeft - elapsedSeconds,
                accumulatedFocusTime: accumulatedFocusTime + addedFocus,
                lastActiveTimestamp: now
              });
            }
          }
        }
      }
    }),
    {
      name: "focus-storage",
      partialize: (state) => ({ 
        youtubeUrl: state.youtubeUrl,
        youtubeHistory: state.youtubeHistory,
        focusMinutes: state.focusMinutes,
        breakMinutes: state.breakMinutes,
        soundEnabled: state.soundEnabled,
        activeTaskId: state.activeTaskId,
        activePlanTaskId: state.activePlanTaskId,
        activeTaskEstimatedMinutes: state.activeTaskEstimatedMinutes,
        pomodoroState: state.pomodoroState,
        timeLeft: state.timeLeft,
        currentSession: state.currentSession,
        totalSessions: state.totalSessions,
        accumulatedFocusTime: state.accumulatedFocusTime,
        lastActiveTimestamp: state.lastActiveTimestamp,
        volume: state.volume,
        isLooping: state.isLooping,
        activeVideoTitle: state.activeVideoTitle,
        activeVideoAuthor: state.activeVideoAuthor,
        activeVideoId: state.activeVideoId,
        currentTime: state.currentTime,
        isVideoBackground: state.isVideoBackground,
        videoBgOpacity: state.videoBgOpacity,
        videoBgBlur: state.videoBgBlur,
      }), 
    }
  )
);
