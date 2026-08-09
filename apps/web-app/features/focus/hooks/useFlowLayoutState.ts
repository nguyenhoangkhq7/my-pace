import { useState, useRef, useEffect, useCallback } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import type { GroupImperativeHandle } from "react-resizable-panels";

const ZEN_FULL_THRESHOLD = 80;

export function useFlowLayoutState() {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const [mounted, setMounted] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [sizes, setSizes] = useState<number[] | null>(null);

  const user = useAuthStore((s) => s.user);
  const todayStr = user ? getTodayStr(user.timezone) : new Date().toISOString().split("T")[0];

  const groupRef = useRef<GroupImperativeHandle | null>(null);
  const lastGoodSizesRef = useRef<[number, number, number]>([20, 60, 20]);
  const canSaveRef = useRef(false);
  const canSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCanSave = useCallback(() => {
    canSaveRef.current = false;
    if (canSaveTimerRef.current) clearTimeout(canSaveTimerRef.current);
    canSaveTimerRef.current = setTimeout(() => {
      canSaveRef.current = true;
    }, 1000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scheduleCanSave();
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") scheduleCanSave();
    };
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      if (canSaveTimerRef.current) clearTimeout(canSaveTimerRef.current);
    };
  }, [scheduleCanSave]);

  const layoutKey = isXl ? "layout-xl" : isLg ? "layout-lg" : "layout-base";

  useEffect(() => {
    if (!isXl && useFocusStore.getState().isZenFull) {
      useFocusStore.getState().setZenFull(false);
    }
  }, [isXl]);

  useEffect(() => {
    const expectedLen = isXl ? 3 : isLg ? 2 : 1;
    Promise.resolve().then(() => {
      const saved = localStorage.getItem(`myPaceFlowSizes_${layoutKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          let loadedSizes = null;
          if (parsed && !Array.isArray(parsed) && parsed.date === todayStr && Array.isArray(parsed.sizes)) {
            loadedSizes = parsed.sizes;
          }

          if (loadedSizes && loadedSizes.length === expectedLen) {
            // Only reset if size is invalid (greater than 0 but less than minSize 15)
            if (expectedLen === 3 && ((loadedSizes[0] > 0 && loadedSizes[0] < 15) || (loadedSizes[2] > 0 && loadedSizes[2] < 15))) {
              setSizes([20, 60, 20]);
              setIsLeftCollapsed(false);
              setIsRightCollapsed(false);
              localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: [20, 60, 20] }));
              return;
            }
            if (expectedLen === 2 && loadedSizes[0] > 0 && loadedSizes[0] < 15) {
              setSizes([25, 75]);
              setIsLeftCollapsed(false);
              localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: [25, 75] }));
              return;
            }

            // Sync collapse state with restored sizes
            if (expectedLen === 3) {
              setIsLeftCollapsed(loadedSizes[0] === 0);
              setIsRightCollapsed(loadedSizes[2] === 0);
            } else if (expectedLen === 2) {
              setIsLeftCollapsed(loadedSizes[0] === 0);
            }

            setSizes(loadedSizes);
            return;
          }
          localStorage.removeItem(`myPaceFlowSizes_${layoutKey}`);
        } catch {}
      }
      if (isXl) {
        setSizes([20, 60, 20]);
        setIsLeftCollapsed(false);
        setIsRightCollapsed(false);
      } else if (isLg) {
        setSizes([25, 75]);
        setIsLeftCollapsed(false);
      } else {
        setSizes([100]);
      }
    });
  }, [layoutKey, resetKey, isXl, isLg, todayStr]);

  const requestFullscreen = () => {
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleExitZenFull = useCallback(() => {
    const store = useFocusStore.getState();
    store.setZenFull(false);
    exitFullscreen();
    const restored = lastGoodSizesRef.current;
    setSizes([...restored]);
    try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: restored })); } catch {}

    // Defer setLayout to the next tick to avoid editing DOM during unmount/remount process
    setTimeout(() => {
      groupRef.current?.setLayout({
        "todo-panel": restored[0],
        "pomodoro-panel": restored[1],
        "zenzone-panel": restored[2],
      });
    }, 50);
  }, [layoutKey]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isBrowserFullscreen = !!document.fullscreenElement;
      if (!isBrowserFullscreen && useFocusStore.getState().isZenFull) {
        handleExitZenFull();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleExitZenFull]);

  const handleLayoutChanged = useCallback((layout: Record<string, number>) => {
    const store = useFocusStore.getState();
    const zenzonePercent = layout["zenzone-panel"] ?? 0;
    const todoPercent = layout["todo-panel"] ?? 0;

    if (isXl) {
      setIsRightCollapsed(zenzonePercent === 0);
    }
    if (isLg) {
      setIsLeftCollapsed(todoPercent === 0);
    }

    if (store.isZenFull) {
      if (isXl && zenzonePercent < 99.5) {
        handleExitZenFull();
      }
      return;
    }

    if (isXl && zenzonePercent >= ZEN_FULL_THRESHOLD) {
      if (sizes && sizes[2] > 0) {
        lastGoodSizesRef.current = [sizes[0], sizes[1], sizes[2]];
      }
      store.setZenFull(true);
      requestFullscreen();
      groupRef.current?.setLayout({
        "todo-panel": 0,
        "pomodoro-panel": 0,
        "zenzone-panel": 100,
      });
      return;
    }

    if (!canSaveRef.current || document.visibilityState !== "visible") return;

    if (isXl && layout["todo-panel"] !== undefined && layout["zenzone-panel"] !== undefined) {
      const arr: [number, number, number] = [layout["todo-panel"], layout["pomodoro-panel"] ?? 60, layout["zenzone-panel"]];
      if ((arr[0] > 0 && arr[0] < 14) || (arr[2] > 0 && arr[2] < 14)) return;
      if (arr[2] > 0) {
        lastGoodSizesRef.current = arr;
      }
      try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: arr })); } catch {}
    } else if (isLg && !isXl && layout["todo-panel"] !== undefined) {
      const arr = [layout["todo-panel"], layout["pomodoro-panel"] ?? 75];
      if (arr[0] > 0 && arr[0] < 14) return;
      try { localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: arr })); } catch {}
    }
  }, [isXl, isLg, layoutKey, handleExitZenFull, setIsRightCollapsed, setIsLeftCollapsed, sizes, todayStr]);

  const handleResetLayout = useCallback(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("myPaceFlowSizes_") || key.includes("PanelGroup")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    if (useFocusStore.getState().isZenFull) {
      useFocusStore.getState().setZenFull(false);
    }
    setSizes(null);
    setResetKey(prev => prev + 1);
  }, []);

  const handleEnterZenFull = useCallback(() => {
    if (!isXl) return;
    const store = useFocusStore.getState();
    lastGoodSizesRef.current = [
      sizes?.[0] ?? 20,
      sizes?.[1] ?? 60,
      sizes?.[2] ?? 20,
    ];
    store.setZenFull(true);
    requestFullscreen();
    groupRef.current?.setLayout({
      "todo-panel": 0,
      "pomodoro-panel": 0,
      "zenzone-panel": 100,
    });
  }, [isXl, sizes]);

  const handleExpandZenZone = useCallback(() => {
    setIsRightCollapsed(false);
    const restored = lastGoodSizesRef.current;
    const zenzoneSize = Math.max(20, restored[2]);
    const remaining = 100 - zenzoneSize;

    const isLeftCurrentlyCollapsed = isLeftCollapsed || (sizes?.[0] === 0);
    const todo = isLeftCurrentlyCollapsed ? 0 : Math.min(sizes?.[0] || restored[0] || Math.round(remaining * 0.25), remaining - 25);
    const pomodoro = 100 - zenzoneSize - todo;

    groupRef.current?.setLayout({
      "todo-panel": todo,
      "pomodoro-panel": pomodoro,
      "zenzone-panel": zenzoneSize,
    });
    setSizes([todo, pomodoro, zenzoneSize]);
    try {
      localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: [todo, pomodoro, zenzoneSize] }));
    } catch {}
  }, [layoutKey, isLeftCollapsed, sizes, todayStr]);

  const handleCollapseZenZone = useCallback(() => {
    setIsRightCollapsed(true);
    const currentSizes = sizes || [20, 60, 20];
    const isLeftCurrentlyCollapsed = isLeftCollapsed || (currentSizes[0] === 0);
    const todo = isLeftCurrentlyCollapsed ? 0 : currentSizes[0];
    const pomodoro = 100 - todo;

    groupRef.current?.setLayout({
      "todo-panel": todo,
      "pomodoro-panel": pomodoro,
      "zenzone-panel": 0,
    });
    setSizes([todo, pomodoro, 0]);
    try {
      localStorage.setItem(`myPaceFlowSizes_${layoutKey}`, JSON.stringify({ date: todayStr, sizes: [todo, pomodoro, 0] }));
    } catch {}
  }, [sizes, isLeftCollapsed, layoutKey, todayStr]);

  return {
    isLg,
    isXl,
    layoutKey,
    mounted,
    resetKey,
    sizes,
    isLeftCollapsed,
    setIsLeftCollapsed,
    isRightCollapsed,
    setIsRightCollapsed,
    groupRef,
    handleLayoutChanged,
    handleResetLayout,
    handleExitZenFull,
    handleEnterZenFull,
    handleExpandZenZone,
    handleCollapseZenZone
  };
}
