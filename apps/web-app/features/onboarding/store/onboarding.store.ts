import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  // Modal state
  isOpen: boolean;
  isHelpMode: boolean;
  startOnboarding: (isHelpMode?: boolean) => void;
  closeOnboardingModal: () => void;

  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isOpen: false,
      isHelpMode: false,
      startOnboarding: (isHelpMode = false) => set({ isOpen: true, isHelpMode }),
      closeOnboardingModal: () => set({ isOpen: false }),

      hasCompletedOnboarding: false,

      completeOnboarding: () => set({
        isOpen: false,
        hasCompletedOnboarding: true
      }),
    }),
    {
      name: "my-pace-onboarding",
      partialize: (state) => ({ hasCompletedOnboarding: state.hasCompletedOnboarding }),
    }
  )
);
