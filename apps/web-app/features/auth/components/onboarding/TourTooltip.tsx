"use client";

import React from "react";
import { X } from "lucide-react";
import { useOnboardingStore } from "../../store/onboarding.store";
import { useTranslation } from "@/hooks/use-translation";

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
            onClick={() => {
              if (stepIndex >= totalSteps - 1) {
                completeOnboarding();
              } else {
                advanceTourStep();
              }
            }}
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
