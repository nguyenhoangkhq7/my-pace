import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  isOpen: boolean;
  currentSlide: number;
  hasCompletedOnboarding: boolean;
  startOnboarding: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isOpen: false,
      currentSlide: 0,
      hasCompletedOnboarding: false,
      startOnboarding: () => set({ isOpen: true, currentSlide: 0 }),
      nextSlide: () => set((state) => ({ currentSlide: Math.min(1, state.currentSlide + 1) })),
      prevSlide: () => set((state) => ({ currentSlide: Math.max(0, state.currentSlide - 1) })),
      completeOnboarding: () => set({ isOpen: false, hasCompletedOnboarding: true }),
    }),
    {
      name: "my-pace-onboarding",
    }
  )
);
