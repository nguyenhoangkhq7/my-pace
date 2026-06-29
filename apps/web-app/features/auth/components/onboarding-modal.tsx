"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "../store/onboarding.store";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OnboardingModal() {
  const {
    isOpen,
    currentSlide,
    hasCompletedOnboarding,
    startOnboarding,
    nextSlide,
    prevSlide,
    completeOnboarding,
  } = useOnboardingStore();

  useEffect(() => {
    // If onboarding is not completed, trigger it to open
    if (!hasCompletedOnboarding) {
      startOnboarding();
    }
  }, [hasCompletedOnboarding, startOnboarding]);

  const totalSlides = 2;

  const handleNext = () => {
    if (currentSlide === totalSlides - 1) {
      completeOnboarding();
    } else {
      nextSlide();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Do not allow closing by clicking outside/pressing ESC unless completed
      if (!open && hasCompletedOnboarding) {
        completeOnboarding();
      }
    }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md max-w-lg rounded-3xl p-6 border-none bg-card shadow-2xl overflow-hidden duration-300">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          
          {/* Animated Illustration Container */}
          <div className="h-40 w-full flex items-center justify-center relative">
            {currentSlide === 0 ? (
              // Slide 1 Illustration (MITs Target / Stars)
              <div className="relative flex items-center justify-center animate-fade-in duration-300">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl h-28 w-28 -z-10" />
                <svg className="w-24 h-24 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" />
                  <circle cx="12" cy="12" r="6" stroke="currentColor" className="opacity-80" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  {/* Star decals */}
                  <path d="M5 5L7 7M19 5L17 7M5 19L7 17M19 19L17 17" strokeLinecap="round" />
                </svg>
                <div className="absolute top-2 right-2 text-amber-500 animate-bounce delay-150">★</div>
                <div className="absolute bottom-2 left-2 text-amber-500 animate-bounce delay-500">★</div>
              </div>
            ) : (
              // Slide 2 Illustration (Eisenhower Grid Q2 pulse)
              <div className="grid grid-cols-2 gap-2 w-32 h-32 relative animate-fade-in duration-300">
                <div className="absolute -inset-2 bg-emerald-500/10 rounded-2xl blur-xl -z-10" />
                
                {/* Q1: Urgent & Important */}
                <div className="border border-border bg-muted/40 rounded-lg flex items-center justify-center text-muted-foreground/50 text-[10px] font-bold">
                  Q1
                </div>
                {/* Q2: Important, Not Urgent (Highlighted) */}
                <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg flex flex-col items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 border-2 relative overflow-hidden group">
                  <span className="text-xs">Q2</span>
                  <span className="text-[8px] font-medium opacity-80 mt-0.5">Calm</span>
                  <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-emerald-400">✓</span>
                  </div>
                </div>
                {/* Q3: Urgent, Not Important */}
                <div className="border border-border bg-muted/40 rounded-lg flex items-center justify-center text-muted-foreground/50 text-[10px] font-bold">
                  Q3
                </div>
                {/* Q4: Not Urgent & Not Important */}
                <div className="border border-border bg-muted/40 rounded-lg flex items-center justify-center text-muted-foreground/50 text-[10px] font-bold">
                  Q4
                </div>
              </div>
            )}
          </div>

          {/* Slide Text Content */}
          <div className="space-y-3 px-2">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {currentSlide === 0 ? "Triết lý MITs" : "Ma trận Eisenhower"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground min-h-[72px]">
              {currentSlide === 0 ? (
                <>
                  Thay vì gồng gánh một danh sách dài vô tận gây quá tải, mỗi ngày bạn chỉ nên cam kết hoàn thành <span className="text-foreground font-semibold">1 đến 3 việc thực sự quan trọng (MITs)</span> trước. Điều này giúp bảo vệ tiêu điểm và duy trì động lực tốt nhất.
                </>
              ) : (
                <>
                  MyPACE tự động phân loại công việc của bạn. Hãy tập trung đầu tư dài hạn vào <span className="text-emerald-400 font-semibold">Vùng Q2 (Quan trọng × Không khẩn cấp)</span>. Đây là chiếc chìa khoá giúp bạn làm chủ mục tiêu và hạn chế tối đa các khủng hoảng.
                </>
              )}
            </DialogDescription>
          </div>

          {/* Slide Dot Indicators */}
          <div className="flex gap-1.5 justify-center py-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-row justify-between items-center w-full gap-3 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={cn("h-11 rounded-xl font-medium", currentSlide === 0 && "opacity-0 pointer-events-none")}
          >
            Quay lại
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            className="h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground transition-all active:scale-[0.98]"
          >
            {currentSlide === totalSlides - 1 ? "Bắt đầu lên kế hoạch" : "Tiếp tục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
