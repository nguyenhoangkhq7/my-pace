import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PomodoroState = "idle" | "focusing" | "breaking" | "finished" | "paused";

interface FocusState {
  // Session config
  focusMinutes: number;
  breakMinutes: number;
  
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

  // Widget settings (persisted)
  youtubeUrl: string;
  youtubeHistory: { url: string; title: string }[];

  // Actions
  setYoutubeUrl: (url: string) => void;
  addToHistory: (url: string, title: string) => void;
  removeFromHistory: (url: string) => void;
  openFocusMode: (taskId: string, planTaskId: string, estimatedMinutes: number) => void;
  closeFocusMode: () => void;
  
  // Timer Actions (called by usePomodoro hook)
  startTimer: () => void;
  pauseTimer: () => void;
  tick: (seconds: number) => void;
  transitionToBreak: () => void;
  transitionToFocus: () => void;
  completeAllSessions: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      focusMinutes: 25,
      breakMinutes: 5,
      
      activeTaskId: null,
      activePlanTaskId: null,
      pomodoroState: "idle",
      timeLeft: 0,
      currentSession: 1,
      totalSessions: 1,
      accumulatedFocusTime: 0,
      
      youtubeUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      youtubeHistory: [
        { url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", title: "Lofi Girl (Default)" }
      ],

      setYoutubeUrl: (url) => set({ youtubeUrl: url }),
      
      addToHistory: (url, title) => set((state) => {
        // Prevent duplicates
        const exists = state.youtubeHistory.some(item => item.url === url);
        if (exists) return state;
        return { youtubeHistory: [{ url, title }, ...state.youtubeHistory] };
      }),

      removeFromHistory: (url) => set((state) => ({
        youtubeHistory: state.youtubeHistory.filter(item => item.url !== url)
      })),
      
      openFocusMode: (taskId, planTaskId, estimatedMinutes) => {
        const { focusMinutes } = get();
        const totalSessions = Math.max(1, Math.ceil(estimatedMinutes / focusMinutes));
        
        set({
          activeTaskId: taskId,
          activePlanTaskId: planTaskId,
          pomodoroState: "idle",
          currentSession: 1,
          totalSessions,
          timeLeft: focusMinutes * 60,
          accumulatedFocusTime: 0,
        });
      },

      closeFocusMode: () => {
        set({
          activeTaskId: null,
          activePlanTaskId: null,
          pomodoroState: "idle",
        });
      },

      startTimer: () => {
        const { pomodoroState } = get();
        if (pomodoroState === "idle" || pomodoroState === "paused") {
          set({ pomodoroState: "focusing" });
        } else if (pomodoroState === "breaking") {
          set({ pomodoroState: "breaking" });
        }
      },

      pauseTimer: () => {
        set({ pomodoroState: "paused" });
      },

      tick: (seconds) => {
        set((state) => {
          let newAccumulated = state.accumulatedFocusTime;
          if (state.pomodoroState === "focusing") {
            newAccumulated += seconds;
          }
          return { 
            timeLeft: Math.max(0, state.timeLeft - seconds),
            accumulatedFocusTime: newAccumulated
          };
        });
      },

      transitionToBreak: () => {
        const { breakMinutes } = get();
        set({
          pomodoroState: "breaking",
          timeLeft: breakMinutes * 60,
        });
      },

      transitionToFocus: () => {
        const { focusMinutes, currentSession } = get();
        set({
          pomodoroState: "focusing",
          timeLeft: focusMinutes * 60,
          currentSession: currentSession + 1,
        });
      },

      completeAllSessions: () => {
        set({
          pomodoroState: "finished",
          timeLeft: 0,
        });
      }
    }),
    {
      name: "focus-storage",
      partialize: (state) => ({ 
        youtubeUrl: state.youtubeUrl,
        youtubeHistory: state.youtubeHistory 
      }), 
    }
  )
);
