import { useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";

export function useFlowKeyboardShortcuts() {
  const activeTaskId = useFocusStore((s) => s.activeTaskId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if user is typing in an input element or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // 2. Ignore if any modal or dialog is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      const key = e.code;

      // Mũi tên phải (ArrowRight) -> Tua nhanh 15 giây (+15s)
      if (key === "ArrowRight") {
        e.preventDefault();
        const store = useFocusStore.getState();
        if (store.playerControls) {
          store.playerControls.seek(Math.max(0, store.currentTime + 15));
        }
        return;
      }

      // Mũi tên trái (ArrowLeft) -> Tua lùi 15 giây (-15s)
      if (key === "ArrowLeft") {
        e.preventDefault();
        const store = useFocusStore.getState();
        if (store.playerControls) {
          store.playerControls.seek(Math.max(0, store.currentTime - 15));
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTaskId]);
}
