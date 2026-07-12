import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

interface NoPlanStateProps {
  activeTab: string;
  onStartPlanning: () => void;
}

export function NoPlanState({ activeTab, onStartPlanning }: NoPlanStateProps) {
  const { t } = useTranslation();
  const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore();

  const handleStartPlanning = () => {
    onStartPlanning();
    if (isTourActive && tourStepIndex === 5) {
      setTimeout(() => {
        const state = useOnboardingStore.getState();
        if (state.isTourActive && state.tourStepIndex === 5) {
          state.setTourStep(6);
        }
      }, 400);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">📝</div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">{t.board.noPlanYet}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
          {t.board.noPlanDesc(activeTab)}
        </p>
      </div>
      <Button onClick={handleStartPlanning} className="bg-primary hover:bg-primary/90 text-white mt-4 cursor-pointer tour-plan-my-day-btn">
        {activeTab === 'today' ? t.board.planMyDay : t.board.planTomorrow}
      </Button>
    </div>
  );
}
