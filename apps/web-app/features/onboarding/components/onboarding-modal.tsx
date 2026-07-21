"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "../store/onboarding.store";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { PhilosophyDetailModal } from "./onboarding/PhilosophyDetailModal";
import { SlidePhilosophy } from "./onboarding/SlidePhilosophy";
import { SlideWorkflow } from "./onboarding/SlideWorkflow";

export function OnboardingModal() {
  const {
    isOpen,
    isHelpMode,
    hasCompletedOnboarding,
    startOnboarding,
    closeOnboardingModal,
    completeOnboarding
  } = useOnboardingStore();
  const { t } = useTranslation();

  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [detailModalTitle, setDetailModalTitle] = useState("");
  const [detailModalContent, setDetailModalContent] = useState("");

  const [step, setStep] = useState(1);

  useEffect(() => {
    // Only automatically open the modal if the user hasn't completed onboarding,
    // and the modal isn't already open
    if (!hasCompletedOnboarding && !isOpen) {
      startOnboarding();
    }
  }, [hasCompletedOnboarding, isOpen, startOnboarding]);

  const openDetail = (title: string, content: string) => {
    setDetailModalTitle(title);
    setDetailModalContent(content);
    setDetailModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          closeOnboardingModal();
          setTimeout(() => setStep(1), 300);
        }
      }}>
        <DialogContent
          aria-describedby={undefined}
          showCloseButton={isHelpMode}
          className="sm:max-w-[500px] w-[95vw] rounded-3xl p-6 border-none bg-card shadow-2xl overflow-y-auto max-h-[90vh] duration-300 scrollbar-thin"
        >
          <DialogHeader className="mb-4 mt-1">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-center text-foreground">
              {step === 1 ? t.onboarding.title : t.onboarding.workflowTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {step === 1 ? (
              <SlidePhilosophy onOpenDetail={openDetail} />
            ) : (
              <SlideWorkflow />
            )}
          </div>

          <DialogFooter className="mt-6 sm:justify-center w-full">
            {step === 1 ? (
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="h-11 w-full sm:w-3/4 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:brightness-110 transition-all active:scale-[0.98]"
              >
                {t.onboarding.tryNow}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  closeOnboardingModal();
                  if (!hasCompletedOnboarding) {
                    completeOnboarding();
                  }
                  setTimeout(() => setStep(1), 300);
                }}
                className="h-11 w-full sm:w-3/4 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:brightness-110 transition-all active:scale-[0.98]"
              >
                {t.onboarding.startNow}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhilosophyDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalTitle}
        detail={detailModalContent}
      />
    </>
  );
}
