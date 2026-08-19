"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface NoPlanStateProps {
  activeTab: string;
  hasDraft?: boolean;
  onOpenBriefing?: () => void;
  onStartPlanning: () => void;
}

export function NoPlanState({
  activeTab,
  hasDraft = false,
  onOpenBriefing,
  onStartPlanning,
}: NoPlanStateProps) {
  const { t } = useTranslation();

  const isEn = t.board.today.toLowerCase() === "today";

  const getTabLabel = () => {
    if (activeTab === "today") return isEn ? "today" : "hôm nay";
    if (activeTab === "tomorrow") return isEn ? "tomorrow" : "ngày mai";
    return activeTab;
  };

  const getButtonLabel = () => {
    if (activeTab === "today") return t.board.planMyDay;
    if (activeTab === "tomorrow") return t.board.planTomorrow;
    return isEn ? "Plan Day" : "Lập kế hoạch ngày";
  };

  if (hasDraft && onOpenBriefing && activeTab === "today") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl shadow-inner animate-in zoom-in-95 duration-300">
          ☀️
        </div>
        <div className="space-y-1 max-w-[280px]">
          <h3 className="text-base font-bold text-foreground">
            {isEn ? "Suggested Plan Ready" : "Đã có bản nháp gợi ý"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Auto-Schedule has prepared a plan proposal based on your free time."
              : "Auto-Schedule đã chuẩn bị sẵn gợi ý kế hoạch dựa trên thời gian rảnh của bạn."}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-[240px] pt-2">
          <Button
            onClick={onOpenBriefing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 rounded-xl shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {/* <Sparkles className="w-3.5 h-3.5" /> */}
            <span>{t.briefing.viewSuggestion}</span>
          </Button>

          <Button
            variant="outline"
            onClick={onStartPlanning}
            className="w-full border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs h-9 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
          >
            {/* <SlidersHorizontal className="w-3.5 h-3.5" /> */}
            <span>{getButtonLabel()}</span>
          </Button>
        </div>
      </div>
    );
  }

  const getDescription = () => {
    return isEn
      ? `Create a plan for ${getTabLabel()} to stay focused and productive.`
      : `Tạo kế hoạch cho ${getTabLabel()} để duy trì sự tập trung và năng suất.`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">
        📝
      </div>
      <div className="space-y-1 max-w-[240px]">
        <h3 className="text-base font-bold text-foreground">{t.board.noPlanYet}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{getDescription()}</p>
      </div>
      <Button
        onClick={onStartPlanning}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 rounded-xl mt-2 cursor-pointer shadow-md shadow-primary/20"
      >
        {getButtonLabel()}
      </Button>
    </div>
  );
}
