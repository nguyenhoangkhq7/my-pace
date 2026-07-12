"use client";

import React, { useEffect, useState, useRef } from "react";
import { useOnboardingStore } from "../../store/onboarding.store";
import { useTranslation } from "@/hooks/use-translation";
import { TourTooltip } from "./TourTooltip";

interface TourStep {
  target: string;
  titleKey: string;
  descKey: string;
  hasNextBtn: boolean;
  placement: "top" | "bottom" | "left" | "right";
  padding?: number;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOTAL_STEPS = 12;

export function AppTour() {
  const { isTourActive, tourStepIndex, completeOnboarding } = useOnboardingStore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  // Refs to avoid stale closures in intervals
  const tourStepIndexRef = useRef(tourStepIndex);
  const isTourActiveRef = useRef(isTourActive);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Keep refs in sync
  useEffect(() => {
    tourStepIndexRef.current = tourStepIndex;
    isTourActiveRef.current = isTourActive;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define steps inline as a getter so we always get fresh selector strings
  const getStepTarget = (idx: number): { target: string; padding: number } | null => {
    const targets = [
      { target: ".fc-view-harness", padding: 0 },
      { target: ".tour-new-task-btn", padding: 8 },
      { target: ".tour-urgent-important", padding: 8 },
      { target: ".tour-task-title-input", padding: 8 },
      { target: ".tour-save-task-btn", padding: 8 },
      { target: ".tour-plan-my-day-btn", padding: 8 },
      { target: ".tour-backlog-item", padding: 8 },
      { target: ".tour-save-plan-btn", padding: 8 },
      { target: ".tour-start-day-btn", padding: 8 },
      { target: ".tour-manual-schedule-btn", padding: 8 },
      { target: ".fc-view-harness", padding: 0 },
      { target: ".tour-focus-nav", padding: 8 },
    ];
    return targets[idx] ?? null;
  };

  // Pure DOM query — no closures over React state
  const tryFindSpotlight = (stepIdx: number): boolean => {
    const info = getStepTarget(stepIdx);
    if (!info) return false;
    const el = document.querySelector(info.target);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const p = info.padding;
    setSpotlight({
      top: rect.top - p,
      left: rect.left - p,
      width: rect.width + p * 2,
      height: rect.height + p * 2,
    });
    return true;
  };

  // Main spotlight effect: fires on step change, retries until element found
  useEffect(() => {
    if (!isTourActive || !mounted) return;

    setSpotlight(null);

    // Clear any previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Try immediately on next frame
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!tryFindSpotlight(tourStepIndex)) {
        // If not found, start polling every 200ms
        intervalRef.current = setInterval(() => {
          const found = tryFindSpotlight(tourStepIndexRef.current);
          if (found) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
          }
        }, 200);
      }
    });

    // Recompute on resize/scroll
    const handleReposition = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        tryFindSpotlight(tourStepIndexRef.current)
      );
    };
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    // Observe element for size/position changes
    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(handleReposition);
    const info = getStepTarget(tourStepIndex);
    const el = info ? document.querySelector(info.target) : null;
    if (el) observerRef.current.observe(el);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      observerRef.current?.disconnect();
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive, tourStepIndex, mounted]);

  if (!mounted || !isTourActive) return null;

  // Build step metadata for render (just titles/placement, no DOM queries)
  const getStepMeta = (idx: number) => {
    const metas = [
      { titleKey: t.onboarding.tour.calendarTitle,       descKey: t.onboarding.tour.calendarDesc,       hasNextBtn: false, placement: "bottom" as const }, // 0: drag on calendar
      { titleKey: t.onboarding.tour.newTaskTitle,        descKey: t.onboarding.tour.newTaskDesc,        hasNextBtn: false, placement: "bottom" as const }, // 1: click new task btn
      { titleKey: t.onboarding.tour.urgentImportantTitle,descKey: t.onboarding.tour.urgentImportantDesc, hasNextBtn: true,  placement: "right"  as const }, // 2: info only — explain Eisenhower
      { titleKey: t.onboarding.tour.inputTitleTitle,     descKey: t.onboarding.tour.inputTitleDesc,     hasNextBtn: false, placement: "bottom" as const }, // 3: user must type task name
      { titleKey: t.onboarding.tour.saveTaskTitle,       descKey: t.onboarding.tour.saveTaskDesc,       hasNextBtn: false, placement: "top"    as const }, // 4: click save btn
      { titleKey: t.onboarding.tour.planMyDayTitle,      descKey: t.onboarding.tour.planMyDayDesc,      hasNextBtn: false, placement: "top"    as const }, // 5: click plan my day
      { titleKey: t.onboarding.tour.selectTaskTitle,     descKey: t.onboarding.tour.selectTaskDesc,     hasNextBtn: false, placement: "right"  as const }, // 6: click backlog task
      { titleKey: t.onboarding.tour.savePlanTitle,       descKey: t.onboarding.tour.savePlanDesc,       hasNextBtn: false, placement: "bottom" as const }, // 7: click save plan
      { titleKey: t.onboarding.tour.startDayTitle,       descKey: t.onboarding.tour.startDayDesc,       hasNextBtn: false, placement: "top"    as const }, // 8: click start my day
      { titleKey: t.onboarding.tour.manualScheduleTitle, descKey: t.onboarding.tour.manualScheduleDesc, hasNextBtn: false, placement: "right"  as const }, // 9: click manual schedule
      { titleKey: t.onboarding.tour.dragDropTitle,       descKey: t.onboarding.tour.dragDropDesc,       hasNextBtn: false, placement: "bottom" as const }, // 10: drag task to calendar
      { titleKey: t.onboarding.tour.focusNavTitle,       descKey: t.onboarding.tour.focusNavDesc,       hasNextBtn: false, placement: "right"  as const }, // 11: click Flow nav
    ];
    return metas[idx] ?? null;
  };

  const step = getStepMeta(tourStepIndex);
  if (!step) return null;

  // Compute tooltip position based on spotlight rect
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlight) return { display: "none" };

    const margin = 16;
    const tooltipW = 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const clampX = (x: number) => Math.min(vw - tooltipW - 8, Math.max(8, x));
    const clampY = (y: number) => Math.max(8, y);

    switch (step.placement) {
      case "right":
        return {
          top: clampY(spotlight.top + spotlight.height / 2 - 120),
          left: clampX(spotlight.left + spotlight.width + margin),
        };
      case "top":
        return {
          bottom: vh - spotlight.top + margin,
          left: clampX(spotlight.left + spotlight.width / 2 - tooltipW / 2),
        };
      case "bottom":
      default:
        return {
          top: clampY(spotlight.top + spotlight.height + margin),
          left: clampX(spotlight.left + spotlight.width / 2 - tooltipW / 2),
        };
    }
  };

  return (
    <>
      {spotlight ? (
        /* Full spotlight overlay with cutout */
        <svg
          className="pointer-events-none fixed inset-0 z-[10001]"
          width="100%"
          height="100%"
          style={{ display: "block" }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={10}
                ry={10}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.68)"
            mask="url(#tour-spotlight-mask)"
          />
          {/* Glowing border */}
          <rect
            x={spotlight.left}
            y={spotlight.top}
            width={spotlight.width}
            height={spotlight.height}
            rx={10}
            ry={10}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            opacity={0.85}
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)))" }}
          />
        </svg>
      ) : (
        /* Light overlay while searching for element */
        <div className="pointer-events-none fixed inset-0 z-[10001] bg-black/30" />
      )}

      {/* Tooltip card */}
      <TourTooltip
        stepIndex={tourStepIndex}
        totalSteps={TOTAL_STEPS}
        title={step.titleKey}
        description={step.descKey}
        hasNextBtn={step.hasNextBtn}
        placement={step.placement}
        style={getTooltipStyle()}
      />

      {/* Loading indicator while spotlight element is being searched */}
      {!spotlight && (
        <div className="fixed bottom-6 left-1/2 z-[10002] -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur-sm">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-medium text-muted-foreground">
              Đang tải bước {tourStepIndex + 1}...
            </span>
          </div>
        </div>
      )}
    </>
  );
}
