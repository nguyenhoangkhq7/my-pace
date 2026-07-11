"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "../store/onboarding.store";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { PhilosophyDetailModal } from "./onboarding/PhilosophyDetailModal";
import { Target, Calendar, Clock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function OnboardingModal() {
  const {
    isOpen,
    isHelpMode,
    isTourActive,
    hasCompletedOnboarding,
    startOnboarding,
    closeOnboardingModal,
    startTour,
  } = useOnboardingStore();
  const { t } = useTranslation();
  const router = useRouter();

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalTitle, setDetailModalTitle] = useState("");
  const [detailModalContent, setDetailModalContent] = useState("");

  useEffect(() => {
    // Only automatically open the modal if the user hasn't completed onboarding,
    // the modal isn't already open, and the interactive tour hasn't started yet.
    if (!hasCompletedOnboarding && !isOpen && !isTourActive) {
      startOnboarding();
    }
  }, [hasCompletedOnboarding, isOpen, isTourActive, startOnboarding]);

  const openDetail = (title: string, content: string) => {
    setDetailModalTitle(title);
    setDetailModalContent(content);
    setDetailModalOpen(true);
  };

  const renderWithKeyword = (text: string, keyword: string, title: string, detail: string) => {
    if (!text || !keyword) return text;
    const parts = text.split(keyword);
    if (parts.length < 2) return text;
    
    return (
      <>
        {parts[0]}
        <span 
          className="font-bold text-primary cursor-pointer hover:underline transition-all"
          onClick={() => openDetail(title, detail)}
        >
          {keyword}
        </span>
        {parts.slice(1).join(keyword)}
      </>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeOnboardingModal(); }}>
        <DialogContent
          showCloseButton={isHelpMode}
          className="sm:max-w-[650px] w-[95vw] rounded-3xl p-8 border-none bg-card shadow-2xl overflow-y-auto max-h-[90vh] duration-300 scrollbar-thin z-50"
        >
          <DialogHeader className="mb-6 mt-2">
            <DialogTitle className="text-3xl font-extrabold tracking-tight text-center text-foreground">
              {t.onboarding.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Eisenhower */}
            <div className="flex gap-4 items-start bg-muted/30 p-4 rounded-2xl">
              <div className="mt-1 p-2 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground pt-1.5">
                {renderWithKeyword(
                  t.onboarding.eisenhower, 
                  t.onboarding.eisenhowerKeyword, 
                  t.onboarding.eisenhowerKeyword, 
                  t.onboarding.eisenhowerDetail
                )}
              </p>
            </div>

            {/* Fixed Events */}
            <div className="flex gap-4 items-start bg-muted/30 p-4 rounded-2xl">
              <div className="mt-1 p-2 bg-purple-500/10 text-purple-500 rounded-xl shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground pt-1.5">
                {renderWithKeyword(
                  t.onboarding.fixedEvents, 
                  t.onboarding.fixedEventsKeyword, 
                  t.onboarding.fixedEventsKeyword, 
                  t.onboarding.fixedEventsDetail
                )}
              </p>
            </div>

            {/* MITs & Available Time */}
            <div className="flex gap-4 items-start bg-muted/30 p-4 rounded-2xl">
              <div className="mt-1 p-2 bg-green-500/10 text-green-500 rounded-xl shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground pt-1.5">
                {renderWithKeyword(
                  t.onboarding.mits, 
                  t.onboarding.mitsKeyword, 
                  t.onboarding.mitsKeyword, 
                  t.onboarding.mitsDetail
                )}
              </p>
            </div>

            {/* Flow Mode */}
            <div className="flex gap-4 items-start bg-muted/30 p-4 rounded-2xl">
              <div className="mt-1 p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground pt-1.5">
                {renderWithKeyword(
                  t.onboarding.flow, 
                  t.onboarding.flowKeyword, 
                  t.onboarding.flowKeyword, 
                  t.onboarding.flowDetail
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-8 sm:justify-center w-full">
            <Button 
              type="button" 
              onClick={() => {
                router.push("/");
                // Wait for the modal exit animation (300ms) and scrollbar restoration to prevent spotlight misalignment
                setTimeout(() => startTour(), 400);
              }}
              className="h-12 w-full sm:w-3/4 rounded-xl font-bold text-base bg-primary text-primary-foreground hover:brightness-110 transition-all active:scale-[0.98]"
            >
              {t.onboarding.tryNow}
            </Button>
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
