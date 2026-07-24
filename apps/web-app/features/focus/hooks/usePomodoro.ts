import { useEffect, useRef, useCallback } from "react";
import { useFocusStore } from "../store/focus.store";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { updateTaskAction } from "@/features/board/actions/task.action";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import type { DailyPlan } from "@/features/board/types";

export function usePomodoro() {
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const soundEnabled = useFocusStore((s) => s.soundEnabled);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const adjustForElapsedTime = useFocusStore((s) => s.adjustForElapsedTime);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { actualMinutes: number } }) =>
      updateTaskAction(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (user) {
        const currentDate = getTodayStr(user.timezone);
        queryClient.setQueryData(['dailyPlan', currentDate], (old: DailyPlan | undefined) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((pt) =>
              pt.task.id === updatedTask.id
                ? { ...pt, task: { ...pt.task, actualMinutes: updatedTask.actualMinutes } }
                : pt
            ),
          };
        });
      }
    },
  });

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

  const updateTaskMutate = updateTaskMutation.mutate;

  // Auto-save actualMinutes every 5 minutes (checkpoint-based)
  // Check every 5 seconds to avoid subscribing React component to per-second timer ticks
  const AUTOSAVE_INTERVAL_MIN = 5;
  useEffect(() => {
    if (!activeTaskId || pomodoroState === "idle" || pomodoroState === "finished" || pomodoroState === "paused") return;

    const checkAutosave = () => {
      const { accumulatedFocusTime } = useFocusStore.getState();
      const currentMinutes = Math.floor(accumulatedFocusTime / 60);
      if (currentMinutes < AUTOSAVE_INTERVAL_MIN) return;
      const currentCheckpoint = Math.floor(currentMinutes / AUTOSAVE_INTERVAL_MIN) * AUTOSAVE_INTERVAL_MIN;
      if (lastSavedMinutesRef.current !== -1 && currentCheckpoint > lastSavedMinutesRef.current) {
        lastSavedMinutesRef.current = currentCheckpoint;
        updateTaskMutate({
          id: activeTaskId,
          data: { actualMinutes: currentMinutes }
        });
      }
    };

    const timerId = setInterval(checkAutosave, 5000);
    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId, pomodoroState]);

  // State transitions sound manager + opportunistic save on pause/break
  const prevStateRef = useRef<string>("idle");
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = pomodoroState;

    // Save actual minutes ONLY on state transitions (not repeatedly while in breaking/finished state)
    const shouldSave = (
      (pomodoroState === "paused" && (prev === "focusing" || prev === "breaking")) ||
      (pomodoroState === "breaking" && prev === "focusing") ||
      (pomodoroState === "finished" && prev !== "finished")
    );
    if (shouldSave && activeTaskId) {
      const mins = Math.round(useFocusStore.getState().accumulatedFocusTime / 60);
      if (mins > 0) {
        updateTaskMutate({ id: activeTaskId, data: { actualMinutes: mins } });
        lastSavedMinutesRef.current = mins;
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
      if (state.activeTaskId) {
        const finalMinutes = Math.round(state.accumulatedFocusTime / 60);
        if (finalMinutes > 0) {
          updateTaskAction(state.activeTaskId, { actualMinutes: finalMinutes }).catch(console.error);
        }
      }
    };
  }, []);
}
