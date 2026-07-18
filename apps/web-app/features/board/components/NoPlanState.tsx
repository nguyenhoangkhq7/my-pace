import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";


interface NoPlanStateProps {
  activeTab: string;
  onStartPlanning: () => void;
}

export function NoPlanState({ activeTab, onStartPlanning }: NoPlanStateProps) {
  const { t } = useTranslation();
  const handleStartPlanning = () => {
    onStartPlanning();
  };

  const isEn = t.board.today.toLowerCase() === "today";
  
  const getTabLabel = () => {
    if (activeTab === 'today') return isEn ? "today" : "hôm nay";
    if (activeTab === 'tomorrow') return isEn ? "tomorrow" : "ngày mai";
    if (activeTab === 'day2') return isEn ? "the day after tomorrow" : "ngày kia";
    if (activeTab === 'day3') return isEn ? "3 days from now" : "ngày kìa";
    return activeTab;
  };

  const getButtonLabel = () => {
    if (activeTab === 'today') return t.board.planMyDay;
    if (activeTab === 'tomorrow') return t.board.planTomorrow;
    if (activeTab === 'day2') return isEn ? "Plan Day After Tomorrow" : "Lập kế hoạch ngày kia";
    if (activeTab === 'day3') return isEn ? "Plan 3 Days From Now" : "Lập kế hoạch ngày kìa";
    return isEn ? "Plan Day" : "Lập kế hoạch ngày";
  };

  const getDescription = () => {
    return isEn 
      ? `Create a plan for ${getTabLabel()} to stay focused and productive.`
      : `Tạo kế hoạch cho ${getTabLabel()} để duy trì sự tập trung và năng suất.`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">📝</div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">{t.board.noPlanYet}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
          {getDescription()}
        </p>
      </div>
      <Button onClick={handleStartPlanning} className="bg-primary hover:bg-primary/90 text-white mt-4 cursor-pointer">
        {getButtonLabel()}
      </Button>
    </div>
  );
}
