"use client";

import React from "react";
import { X } from "lucide-react";
import { useOnboardingStore } from "../../store/onboarding.store";
import { useTranslation } from "@/hooks/use-translation";

// Map step index -> selector of element that should be auto-clicked when user
// presses "Tiếp tục" (i.e. the button BOTH advances tour AND triggers a UI action).
// Only list steps where the action (opening a modal, saving data, navigating) is
// REQUIRED before the next step's element can appear in the DOM.
const STEP_AUTO_CLICK: Record<number, string> = {
  1: ".tour-new-task-btn",          // Step 2: click to open task creation modal
  4: ".tour-save-task-btn",         // Step 5: click to save task to backlog
  5: ".tour-plan-my-day-btn",       // Step 6: click to enter planning mode
  7: ".tour-save-plan-btn",         // Step 8: click to save plan (needed before start-day btn appears)
  8: ".tour-start-day-btn",         // Step 9: click to open Start My Day modal
  9: ".tour-manual-schedule-btn",   // Step 10: click to close modal & navigate to calendar
};

interface TourTooltipProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  description: string;
  hasNextBtn: boolean;
  style?: React.CSSProperties;
  placement?: "top" | "bottom" | "left" | "right";
}

export function TourTooltip({
  stepIndex,
  totalSteps,
  title,
  description,
  hasNextBtn,
  style,
}: TourTooltipProps) {
  const { advanceTourStep, completeOnboarding } = useOnboardingStore();
  const { t } = useTranslation();

  const handleContinue = () => {
    if (stepIndex >= totalSteps - 1) {
      completeOnboarding();
      return;
    }

    // For steps that require opening a UI element before the next step renders,
    // programmatically click that element. The element's own onClick handler will
    // call advanceTourStep() internally, so we do NOT call it here.
    const autoClickSelector = STEP_AUTO_CLICK[stepIndex];
    if (autoClickSelector) {
      const el = document.querySelector<HTMLElement>(autoClickSelector);
      if (el) {
        el.click();
        return; // advancement handled by element's onClick
      }
    }

    // Default: just advance to next step
    advanceTourStep();
  };

  return (
    <div
      className="fixed z-[10002] w-[320px] rounded-2xl border border-border bg-card shadow-2xl"
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-md shadow-primary/30">
            {stepIndex + 1}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>
        <button
          onClick={() => completeOnboarding()}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Skip tour"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        <h3 className="mb-1.5 text-[15px] font-bold leading-snug text-foreground">
          {title}
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>

        {hasNextBtn && (
          <button
            onClick={handleContinue}
            className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {stepIndex >= totalSteps - 1 ? "Hoàn thành 🎉" : `${t.common.continue} →`}
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stepIndex
                ? "w-5 bg-primary"
                : i < stepIndex
                ? "w-1.5 bg-primary/40"
                : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
