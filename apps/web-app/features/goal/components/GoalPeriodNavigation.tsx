import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GoalPeriodNavigationProps {
  timeFilter: "week" | "month" | "year";
  setTimeFilter: (filter: "week" | "month" | "year") => void;
  handlePrev: () => void;
  handleNext: () => void;
  isFuturePeriod: boolean;
  periodLabel: string;
}

export function GoalPeriodNavigation({
  timeFilter,
  setTimeFilter,
  handlePrev,
  handleNext,
  isFuturePeriod,
  periodLabel,
}: GoalPeriodNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-7 h-7 border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          onClick={handlePrev}
        >
          ◀
        </Button>
        <span className="text-xs font-semibold text-slate-300 min-w-[125px] text-center">
          {periodLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-7 h-7 border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          onClick={handleNext}
          disabled={isFuturePeriod}
        >
          ▶
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={timeFilter}
        onValueChange={(val) => setTimeFilter(val as "week" | "month" | "year")}
        className="w-fit"
      >
        <TabsList className="bg-slate-900 border border-slate-800 text-slate-400 h-8 p-1">
          <TabsTrigger
            value="week"
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1"
          >
            Tuần
          </TabsTrigger>
          <TabsTrigger
            value="month"
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1"
          >
            Tháng
          </TabsTrigger>
          <TabsTrigger
            value="year"
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1"
          >
            Năm
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
