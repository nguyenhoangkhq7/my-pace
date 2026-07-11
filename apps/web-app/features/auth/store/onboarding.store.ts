import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  // Modal state
  isOpen: boolean;
  isHelpMode: boolean;
  startOnboarding: (isHelpMode?: boolean) => void;
  closeOnboardingModal: () => void;

  // Tour state
  isTourActive: boolean;
  tourStepIndex: number;
  hasCompletedOnboarding: boolean;
  startTour: () => void;
  setTourStep: (step: number) => void;
  advanceTourStep: () => void;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isOpen: false,
      isHelpMode: false,
      startOnboarding: (isHelpMode = false) => set({ isOpen: true, isHelpMode, isTourActive: false }),
      closeOnboardingModal: () => set({ isOpen: false }),

      isTourActive: false,
      tourStepIndex: 0,
      hasCompletedOnboarding: false,
      
      startTour: () => {
        set({ 
          isOpen: false, // close modal when tour starts
          isTourActive: true, 
          tourStepIndex: 0 
        });
      },
      setTourStep: (step) => set({ tourStepIndex: step }),
      advanceTourStep: () => set((state) => ({ tourStepIndex: state.tourStepIndex + 1 })),
      completeOnboarding: () => set({ 
        isOpen: false, 
        isTourActive: false, 
        hasCompletedOnboarding: true 
      }),
    }),
    {
      name: "my-pace-onboarding",
      partialize: (state) => ({ hasCompletedOnboarding: state.hasCompletedOnboarding }),
    }
  )
);
