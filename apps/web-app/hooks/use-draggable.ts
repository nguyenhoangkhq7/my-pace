import { useState, useRef, useCallback } from "react";

export function useDraggable(initialPosition = { x: 0, y: 0 }) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only allow left click drag
    if (e.button !== 0) return;
    
    // Ignore drag if clicking on an interactive element like a button
    if ((e.target as HTMLElement).closest("button")) return;

    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      // Get viewport dimensions
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      // Basic bounds checking
      if (nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + rect.width > vw) newX = vw - rect.width;
        if (newY + rect.height > vh) newY = vh - rect.height;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, [isDragging]);

  return {
    position,
    setPosition,
    isDragging,
    nodeRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    }
  };
}
