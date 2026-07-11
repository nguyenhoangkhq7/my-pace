"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useOnboardingStore } from "../../store/onboarding.store";
import { useTranslation } from "@/hooks/use-translation";
import { TourTooltip } from "./TourTooltip";

interface TourStep {
  /** CSS selector for the element to spotlight */
  target: string;
  titleKey: string;
  descKey: string;
  /** Whether to show the "Tiếp tục" button in tooltip (for info-only steps) */
  hasNextBtn: boolean;
  /** Tooltip placement relative to spotlight */
  placement: "top" | "bottom" | "left" | "right";
  /** Padding around the spotlight cutout (px) */
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
  const rafRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Define steps
  const steps: TourStep[] = [
    {
      target: ".fc-view-harness",
      titleKey: t.onboarding.tour.calendarTitle,
      descKey: t.onboarding.tour.calendarDesc,
      hasNextBtn: true,
      placement: "bottom",
      padding: 0,
    },
    {
      target: ".tour-new-task-btn",
      titleKey: t.onboarding.tour.newTaskTitle,
      descKey: t.onboarding.tour.newTaskDesc,
      hasNextBtn: true,
      placement: "bottom",
    },
    {
      target: ".tour-urgent-important",
      titleKey: t.onboarding.tour.urgentImportantTitle,
      descKey: t.onboarding.tour.urgentImportantDesc,
      hasNextBtn: true,
      placement: "right",
    },
    {
      target: ".tour-task-title-input",
      titleKey: t.onboarding.tour.inputTitleTitle,
      descKey: t.onboarding.tour.inputTitleDesc,
      hasNextBtn: true,
      placement: "bottom",
    },
    {
      target: ".tour-save-task-btn",
      titleKey: t.onboarding.tour.saveTaskTitle,
      descKey: t.onboarding.tour.saveTaskDesc,
      hasNextBtn: true,
      placement: "top",
    },
    {
      target: ".tour-plan-my-day-btn",
      titleKey: t.onboarding.tour.planMyDayTitle,
      descKey: t.onboarding.tour.planMyDayDesc,
      hasNextBtn: true,
      placement: "top",
    },
    {
      target: ".tour-backlog-item",
      titleKey: t.onboarding.tour.selectTaskTitle,
      descKey: t.onboarding.tour.selectTaskDesc,
      hasNextBtn: true,
      placement: "right",
    },
    {
      target: ".tour-save-plan-btn",
      titleKey: t.onboarding.tour.savePlanTitle,
      descKey: t.onboarding.tour.savePlanDesc,
      hasNextBtn: true,
      placement: "bottom",
    },
    {
      target: ".tour-start-day-btn",
      titleKey: t.onboarding.tour.startDayTitle,
      descKey: t.onboarding.tour.startDayDesc,
      hasNextBtn: true,
      placement: "top",
    },
    {
      target: ".tour-manual-schedule-btn",
      titleKey: t.onboarding.tour.manualScheduleTitle,
      descKey: t.onboarding.tour.manualScheduleDesc,
      hasNextBtn: true,
      placement: "right",
    },
    {
      target: ".fc-view-harness",
      titleKey: t.onboarding.tour.dragDropTitle,
      descKey: t.onboarding.tour.dragDropDesc,
      hasNextBtn: true,
      placement: "bottom",
      padding: 0,
    },
    {
      target: ".tour-focus-nav",
      titleKey: t.onboarding.tour.focusNavTitle,
      descKey: t.onboarding.tour.focusNavDesc,
      hasNextBtn: true,
      placement: "right",
    },
  ];

  const updateSpotlight = useCallback(() => {
    if (!isTourActive) return;
    const step = steps[tourStepIndex];
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) {
      setSpotlight(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const padding = step.padding ?? 8;
    setSpotlight({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  }, [isTourActive, tourStepIndex, steps]);

  // Recompute on step change or resize
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isTourActive || !mounted) return;

    // Initial computation
    const compute = () => {
      rafRef.current = requestAnimationFrame(updateSpotlight);
    };
    compute();

    // Re-observe on DOM changes
    observerRef.current = new ResizeObserver(compute);
    const step = steps[tourStepIndex];
    const el = step ? document.querySelector(step.target) : null;
    if (el) observerRef.current.observe(el);

    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observerRef.current?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive, tourStepIndex, mounted]);

  if (!mounted || !isTourActive) return null;

  const step = steps[tourStepIndex];
  if (!step) return null;

  // Compute tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlight) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const margin = 16;
    const tooltipW = 320;

    switch (step.placement) {
      case "right":
        return {
          top: Math.max(8, spotlight.top + spotlight.height / 2 - 100),
          left: spotlight.left + spotlight.width + margin,
        };
      case "left":
        return {
          top: Math.max(8, spotlight.top + spotlight.height / 2 - 100),
          left: spotlight.left - tooltipW - margin,
        };
      case "top":
        return {
          bottom: window.innerHeight - spotlight.top + margin,
          left: Math.min(
            window.innerWidth - tooltipW - 8,
            Math.max(8, spotlight.left + spotlight.width / 2 - tooltipW / 2)
          ),
        };
      case "bottom":
      default:
        return {
          top: spotlight.top + spotlight.height + margin,
          left: Math.min(
            window.innerWidth - tooltipW - 8,
            Math.max(8, spotlight.left + spotlight.width / 2 - tooltipW / 2)
          ),
        };
    }
  };

  return (
    <>
      {/* Dark overlay with spotlight cutout using SVG */}
      <svg
        className="pointer-events-none fixed inset-0 z-[10001]"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White = show overlay */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black = punch hole (show UI underneath) */}
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={10}
                ry={10}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
        {/* Glowing border around spotlight */}
        {spotlight && (
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
            opacity={0.8}
            style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }}
          />
        )}
      </svg>

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
    </>
  );
}
