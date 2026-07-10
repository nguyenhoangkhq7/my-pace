import { useEffect, useRef, useCallback } from "react";
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
    completeAllSessions,
    soundEnabled
  } = useFocusStore();

  const lastTickRef = useRef<number>(0);

  // Play a system beep using Web Audio API
  const playSystemBeep = useCallback((frequency: number = 600, duration: number = 200, vol: number = 0.5) => {
    if (!soundEnabled || typeof window === "undefined") return;
    
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  }, [soundEnabled]);

  const playFocusEnd = useCallback(() => {
    playSystemBeep(800, 300); // Higher pitch for focus end
    setTimeout(() => playSystemBeep(800, 400), 400); // Double beep
  }, [playSystemBeep]);

  const playBreakEnd = useCallback(() => {
    playSystemBeep(500, 250); // Lower pitch for break end
    setTimeout(() => playSystemBeep(600, 300), 300);
  }, [playSystemBeep]);

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
    completeAllSessions,
    playFocusEnd,
    playBreakEnd
  ]);

  return { pomodoroState, timeLeft, currentSession, totalSessions };
}
