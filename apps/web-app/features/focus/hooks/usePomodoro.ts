import { useEffect, useRef } from "react";
import { useFocusStore } from "../store/focus.store";

export function usePomodoro() {
  const {
    pomodoroState,
    timeLeft,
    currentSession,
    totalSessions,
    tick,
    transitionToBreak,
    transitionToFocus,
    completeAllSessions
  } = useFocusStore();

  const lastTickRef = useRef<number>(0);
  const focusAudioRef = useRef<HTMLAudioElement | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      focusAudioRef.current = new Audio("/audio/tibetan-bowl.mp3");
      breakAudioRef.current = new Audio("/audio/soft-chime.mp3");
    }
  }, []);

  const playFocusEnd = () => {
    if (focusAudioRef.current) {
      focusAudioRef.current.currentTime = 0;
      focusAudioRef.current.play().catch(console.error);
    }
  };

  const playBreakEnd = () => {
    if (breakAudioRef.current) {
      breakAudioRef.current.currentTime = 0;
      breakAudioRef.current.play().catch(console.error);
    }
  };

  useEffect(() => {
    if (pomodoroState === "idle" || pomodoroState === "finished" || pomodoroState === "paused") {
      return;
    }

    lastTickRef.current = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastTickRef.current) / 1000);
      
      if (deltaSeconds >= 1) {
        lastTickRef.current = now;
        
        if (timeLeft - deltaSeconds <= 0) {
          // Timer reached 0
          if (pomodoroState === "focusing") {
            playFocusEnd();
            if (currentSession >= totalSessions) {
              completeAllSessions();
            } else {
              transitionToBreak();
            }
          } else if (pomodoroState === "breaking") {
            playBreakEnd();
            transitionToFocus();
          }
        } else {
          tick(deltaSeconds);
        }
      }
    }, 200); // Check frequently to ensure responsiveness

    return () => clearInterval(intervalId);
  }, [
    pomodoroState,
    timeLeft,
    currentSession,
    totalSessions,
    tick,
    transitionToBreak,
    transitionToFocus,
    completeAllSessions
  ]);

  return { pomodoroState, timeLeft, currentSession, totalSessions };
}
