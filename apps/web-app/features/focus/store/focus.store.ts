import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PomodoroState = "idle" | "focusing" | "breaking" | "finished" | "paused";

interface FocusState {
  // Session config
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
  
  // Current active task
  activeTaskId: string | null;
  activePlanTaskId: string | null;
  
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

  // Modal control
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Zen Zone full mode (auto-triggered when panel dragged >= 65%)
  isZenFull: boolean;
  setZenFull: (value: boolean) => void;

  // Flow Fullscreen mode
  isFlowFullscreen: boolean;
  toggleFlowFullscreen: () => void;

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
      isSettingsOpen: false,
      isZenFull: false,
      isFlowFullscreen: false,
      promptTask: null,
      isPomodoroFloating: false,

      setPomodoroFloating: (value) => set({ isPomodoroFloating: value }),
      setPromptTask: (task) => set({ promptTask: task }),
      setYoutubeUrl: (url) => set({ youtubeUrl: url }),
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setZenFull: (value) => set({ isZenFull: value }),
      toggleFlowFullscreen: () => set((state) => ({ isFlowFullscreen: !state.isFlowFullscreen })),
      
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
        // Calculate remaining sessions considering already-worked time
        const remainingMinutes = Math.max(0, estimatedMinutes - alreadyWorkedMinutes);
        const totalSessions = Math.max(1, Math.ceil(remainingMinutes / focusMinutes));
        
        set({
          activeTaskId: taskId,
          activePlanTaskId: planTaskId,
          pomodoroState: "idle",
          currentSession: 1,
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
        set({
          focusMinutes: focusMin,
          breakMinutes: breakMin,
          soundEnabled: sound,
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
        pomodoroState: state.pomodoroState,
        timeLeft: state.timeLeft,
        currentSession: state.currentSession,
        totalSessions: state.totalSessions,
        accumulatedFocusTime: state.accumulatedFocusTime,
        lastActiveTimestamp: state.lastActiveTimestamp,
      }), 
    }
  )
);
