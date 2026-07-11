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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-muted/30 p-3 rounded-xl border border-border/80">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-7 h-7 border-border bg-card text-muted-foreground hover:text-foreground"
          onClick={handlePrev}
        >
          ◀
        </Button>
        <span className="text-xs font-semibold text-foreground min-w-[125px] text-center">
          {periodLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-7 h-7 border-border bg-card text-muted-foreground hover:text-foreground"
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
        <TabsList className="bg-card border border-border text-muted-foreground h-8 p-1">
          <TabsTrigger
            value="week"
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1"
          >
            Tuần
          </TabsTrigger>
          <TabsTrigger
            value="month"
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1"
          >
            Tháng
          </TabsTrigger>
          <TabsTrigger
            value="year"
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1"
          >
            Năm
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
