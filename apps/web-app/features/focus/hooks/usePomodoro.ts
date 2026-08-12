import { useEffect, useRef, useCallback } from "react";
import { useFocusStore } from "../store/focus.store";
import { useQueryClient } from "@tanstack/react-query";
import { createTimeLog, updateTimeLog } from "../services/timelog-service";

export function usePomodoro() {
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const soundEnabled = useFocusStore((s) => s.soundEnabled);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const adjustForElapsedTime = useFocusStore((s) => s.adjustForElapsedTime);

  const queryClient = useQueryClient();


  const lastTickRef = useRef<number>(0);
  const lastSavedMinutesRef = useRef<number>(-1);

  // Play a system beep using Web Audio API
  const playSystemBeep = useCallback((frequency: number = 600, duration: number = 200, vol: number = 1.0) => {
    if (!soundEnabled || typeof window === "undefined") return;
    
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
      const playDurationSec = duration / 1000;
      // Hold full volume for 80% of duration, then decay linearly to zero
      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime + playDurationSec * 0.8);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + playDurationSec);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + playDurationSec);

      setTimeout(() => {
        audioCtx.close().catch(() => {});
      }, duration + 100);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  }, [soundEnabled]);

  const playFocusEnd = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;

    const audio = new Audio('/sounds/focus-end.mp3');
    audio.volume = 1.0;
    audio.play().catch(() => {
      // Fallback to double beep
      playSystemBeep(800, 300, 1.0);
      setTimeout(() => playSystemBeep(800, 400, 1.0), 400);
    });
  }, [soundEnabled, playSystemBeep]);

  const playBreakEnd = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;

    const audio = new Audio('/sounds/break-end.mp3');
    audio.volume = 1.0;
    audio.play().catch(() => {
      // Fallback to break-end chime
      playSystemBeep(500, 250, 1.0);
      setTimeout(() => playSystemBeep(600, 300, 1.0), 300);
    });
  }, [soundEnabled, playSystemBeep]);

  const playFocusStart = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    const audio = new Audio('/sounds/focus-start.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {
      // Fallback: quiet low-high double system beep
      playSystemBeep(500, 100, 0.5);
      setTimeout(() => playSystemBeep(700, 150, 0.6), 120);
    });
  }, [soundEnabled, playSystemBeep]);

  const playTimerPause = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    const audio = new Audio('/sounds/timer-pause.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Fallback: quick low click sound
      playSystemBeep(300, 80, 0.4);
    });
  }, [soundEnabled, playSystemBeep]);

  const playCelebration = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    const audio = new Audio('/sounds/celebration.mp3');
    audio.volume = 1.0;
    audio.play().catch(() => {
      // Fallback: warm major chord chimes
      playSystemBeep(523.25, 200, 0.8); // C5
      setTimeout(() => playSystemBeep(659.25, 200, 0.8), 150); // E5
      setTimeout(() => playSystemBeep(783.99, 300, 0.9), 300); // G5
      setTimeout(() => playSystemBeep(1046.50, 450, 1.0), 450); // C6
    });
  }, [soundEnabled, playSystemBeep]);

  // Adjust for background time when browser wakes up tab or gets focus
  useEffect(() => {
    const handleWakeUp = () => {
      lastTickRef.current = Date.now();
      adjustForElapsedTime();
    };

    handleWakeUp();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleWakeUp();
      }
    };

    window.addEventListener("focus", handleWakeUp);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWakeUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [adjustForElapsedTime]);

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
        const state = useFocusStore.getState();
        
        if (state.timeLeft - deltaSeconds <= 0) {
          // Timer reached 0
          if (state.pomodoroState === "focusing") {
            playFocusEnd();
            if (state.currentSession >= state.totalSessions) {
              state.completeAllSessions();
            } else {
              state.transitionToBreak();
            }
          } else if (state.pomodoroState === "breaking") {
            playBreakEnd();
            state.transitionToFocus();
          }
        } else {
          state.tick(deltaSeconds);
        }
      }
    }, 200); // Check frequently to ensure responsiveness

    return () => clearInterval(intervalId);
  }, [
    pomodoroState,
    playFocusEnd,
    playBreakEnd
  ]);

  // Initialize/reset lastSavedMinutesRef when activeTaskId changes
  useEffect(() => {
    if (activeTaskId) {
      lastSavedMinutesRef.current = Math.floor(useFocusStore.getState().accumulatedFocusTime / 60);
    } else {
      lastSavedMinutesRef.current = -1;
    }
  }, [activeTaskId]);

  // Auto-save: Ping TimeLog every 5 minutes
  const AUTOSAVE_INTERVAL_MIN = 5;
  useEffect(() => {
    if (!activeTaskId || pomodoroState === "idle" || pomodoroState === "finished" || pomodoroState === "paused") return;

    const checkAutosave = () => {
      const { accumulatedFocusTime, activeTimeLogId, focusSessionStartAccumulatedTime } = useFocusStore.getState();
      const currentMinutes = Math.floor(accumulatedFocusTime / 60);
      if (currentMinutes < AUTOSAVE_INTERVAL_MIN) return;
      const currentCheckpoint = Math.floor(currentMinutes / AUTOSAVE_INTERVAL_MIN) * AUTOSAVE_INTERVAL_MIN;
      if (lastSavedMinutesRef.current !== -1 && currentCheckpoint > lastSavedMinutesRef.current) {
        lastSavedMinutesRef.current = currentCheckpoint;
        if (activeTimeLogId) {
          const focusDeltaSeconds = accumulatedFocusTime - focusSessionStartAccumulatedTime;
          const sessionMinutes = Math.max(0, Math.round(focusDeltaSeconds / 60));
          updateTimeLog(activeTimeLogId, {
            loggedMinutes: sessionMinutes,
            endedAt: new Date().toISOString()
          }).then(() => {
             queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
          }).catch(console.error);
        }
      }
    };

    const timerId = setInterval(checkAutosave, 5000);
    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId, pomodoroState]);

  // State transitions sound manager + opportunistic TimeLog create/update on state changes
  const prevStateRef = useRef<string>("idle");
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = pomodoroState;

    if (activeTaskId) {
      const state = useFocusStore.getState();

      // CREATION: When entering focusing from non-focusing state, create a new TimeLog
      if (pomodoroState === "focusing" && prev !== "focusing") {
        const sessionStart = state.focusSessionStartedAt || new Date().toISOString();
        createTimeLog({
          timeBlockId: state.activeTimeBlockInfo?.id,
          taskId: activeTaskId,
          loggedMinutes: 0,
          startedAt: sessionStart,
          endedAt: sessionStart,
        }).then((res) => {
          useFocusStore.setState({ activeTimeLogId: res.id });
        }).catch(console.error);
      }

      // FINAL UPDATE: When leaving focusing state, finalize the TimeLog
      const shouldFinalize = prev === "focusing" && pomodoroState !== "focusing";
      if (shouldFinalize && state.activeTimeLogId) {
        const focusDeltaSeconds = state.accumulatedFocusTime - state.focusSessionStartAccumulatedTime;
        const sessionMinutes = Math.max(0, Math.round(focusDeltaSeconds / 60));
        updateTimeLog(state.activeTimeLogId, {
          loggedMinutes: sessionMinutes,
          endedAt: new Date().toISOString()
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
          queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
          queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
        }).catch(console.error);
        useFocusStore.setState({ activeTimeLogId: null, focusSessionStartedAt: null });
      }
    }

    if (pomodoroState === "focusing") {
      // Only play start sound if coming from idle or paused (not from breaking)
      if (prev === "idle" || prev === "paused") {
        playFocusStart();
      }
    } else if (pomodoroState === "paused") {
      // Only play pause sound if coming from focusing or breaking
      if (prev === "focusing" || prev === "breaking") {
        playTimerPause();
      }
    } else if (pomodoroState === "finished") {
      if (prev === "focusing") {
        playCelebration();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroState, activeTaskId, playFocusStart, playTimerPause, playCelebration]);

  // Cleanup: Save progress when navigating away (unmounting)
  useEffect(() => {
    return () => {
      const state = useFocusStore.getState();
      if (state.activeTimeLogId && state.activeTaskId) {
        const focusDeltaSeconds = state.accumulatedFocusTime - state.focusSessionStartAccumulatedTime;
        const sessionMinutes = Math.max(0, Math.round(focusDeltaSeconds / 60));
        // We use fetch API with keepalive for reliable unmount tracking, though browser support varies
        // A simple fetch is better than nothing during unmount
        navigator.sendBeacon?.(
          `${process.env.NEXT_PUBLIC_API_URL}/api/time-logs/${state.activeTimeLogId}`,
          JSON.stringify({ loggedMinutes: sessionMinutes, endedAt: new Date().toISOString() })
        );
      }
    };
  }, []);
}
