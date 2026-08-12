"use client";

import { cn } from "@/lib/utils";
import { useStatsPage } from "../hooks/useStatsPage";
import { StatsHeaderSection } from "./StatsHeaderSection";
import { EisenhowerMatrixChart } from "./EisenhowerMatrixChart";
import { CategoryChart } from "./CategoryChart";
import { PlanVsActualChart } from "./PlanVsActualChart";
import { KPISection } from "./KPISection";
import { StatsLoadingState } from "./StatsLoadingState";
import { StatsErrorState } from "./StatsErrorState";
import { HourlyHeatmap } from "./HourlyHeatmap";
import { useAvailableTimeQuery } from "@/features/available-time/hooks/useAvailableTime";
import { formatDateStr } from "../utils/statsDateUtils";

export function StatsPage() {
  const {
    overview,
    isLoading,
    error,
    range,
    setRange,
    start,
    end,
    handlePrev,
    handleNext,
    matrixData,
    categoryData,
    planVsActualData,
  } = useStatsPage();

  const todayStr = formatDateStr(new Date());
  const { data: dataToday } = useAvailableTimeQuery(todayStr);
  const streak = overview?.streak ?? dataToday?.streak ?? 0;

  if (isLoading && !matrixData.length && !categoryData.length) {
    return <StatsLoadingState />;
  }

  if (error) {
    return <StatsErrorState error={error} />;
  }

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-8 bg-background text-foreground">
      {/* Header & Filter Bar */}
      <StatsHeaderSection
        range={range}
        setRange={setRange}
        start={start}
        end={end}
        onPrev={handlePrev}
        onNext={handleNext}
        streak={streak}
      />

      {/* KPI Cards Grid */}
      <KPISection
        completionRate={overview?.completionRate ?? 0}
        streak={streak}
        q2FocusRatio={overview?.q2FocusRatio ?? 0}
        estimationAccuracy={overview?.estimationAccuracy ?? 0}
      />

      {/* Main Content Dashboard */}
      <div className={cn("space-y-8 transition-opacity duration-200", isLoading && "opacity-60")}>
        {/* Plan vs Actual Chart */}
        <PlanVsActualChart data={planVsActualData} />

        {/* Hourly Focus Heatmap */}
        {overview?.hourlyFocusMinutes && (
          <HourlyHeatmap data={overview.hourlyFocusMinutes} />
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Matrix Chart */}
          <EisenhowerMatrixChart matrixData={matrixData} />

          {/* Category Chart */}
          <CategoryChart categoryData={categoryData} />
        </div>
      </div>
    </div>
  );
}

