"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "../store/onboarding.store";
import { useAuthStore } from "../store/auth.store";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sub-components
import { SlideMITs } from "./onboarding/SlideMITs";
import { SlideEisenhower } from "./onboarding/SlideEisenhower";
import { SlideDailyPlan } from "./onboarding/SlideDailyPlan";

export function OnboardingModal() {
  const {
    isOpen,
    currentSlide,
    hasCompletedOnboarding,
    isHelpMode,
    startOnboarding,
    nextSlide,
    prevSlide,
    completeOnboarding,
  } = useOnboardingStore();

  const user = useAuthStore((s) => s.user);
  const wakeLabel = user?.wakeTime ? user.wakeTime.substring(0, 5) : "07:00";
  const sleepLabel = user?.sleepTime ? user.sleepTime.substring(0, 5) : "23:00";
  const [wakeH, wakeM] = wakeLabel.split(":").map(Number);
  const [sleepH, sleepM] = sleepLabel.split(":").map(Number);
  const totalMins = Math.max(60, sleepH * 60 + sleepM - (wakeH * 60 + wakeM));
  const totalHours = totalMins / 60;
  // Simulate: fixed events = 2h, buffer = 20% of total, free = rest
  const fixedH = 2;
  const bufferH = Math.round(totalHours * 0.2 * 10) / 10;
  const freeH = Math.round((totalHours - fixedH - bufferH) * 10) / 10;

  useEffect(() => {
    if (!hasCompletedOnboarding) startOnboarding();
  }, [hasCompletedOnboarding, startOnboarding]);

  const totalSlides = 3;
  const handleNext = () => currentSlide === totalSlides - 1 ? completeOnboarding() : nextSlide();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) completeOnboarding(); }}>
      <DialogContent
        showCloseButton={isHelpMode}
        className="sm:max-w-[520px] max-w-lg rounded-3xl p-6 border-none bg-card shadow-2xl overflow-y-auto max-h-[90vh] duration-300 scrollbar-thin"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          
          {currentSlide === 0 && <SlideMITs isHelpMode={isHelpMode} />}
          {currentSlide === 1 && <SlideEisenhower />}
          {currentSlide === 2 && (
            <SlideDailyPlan 
              wakeLabel={wakeLabel}
              sleepLabel={sleepLabel}
              totalHours={totalHours}
              fixedH={fixedH}
              bufferH={bufferH}
              freeH={freeH}
            />
          )}

          {/* ══ DOT INDICATORS ══ */}
          <div className="flex gap-1.5 justify-center pt-1">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div key={idx} className={cn("h-1.5 rounded-full transition-all duration-300", currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
            ))}
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <DialogFooter className="flex flex-row justify-between items-center w-full gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={prevSlide} disabled={currentSlide === 0}
            className={cn("h-11 rounded-xl font-medium", currentSlide === 0 && "opacity-0 pointer-events-none")}>
            Quay lại
          </Button>
          <Button type="button" onClick={handleNext}
            className="h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground transition-all active:scale-[0.98]">
            {currentSlide === totalSlides - 1 ? (isHelpMode ? "Đóng" : "Bắt đầu lên kế hoạch") : "Tiếp tục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
