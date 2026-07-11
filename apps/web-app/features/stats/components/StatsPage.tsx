"use client";

import { cn } from "@/lib/utils";
import { useStatsPage } from "../hooks/useStatsPage";
import { StatsHeaderSection } from "./StatsHeaderSection";
import { KPISection } from "./KPISection";
import { EisenhowerMatrixChart } from "./EisenhowerMatrixChart";
import { CategoryChart } from "./CategoryChart";
import { StatsLoadingState } from "./StatsLoadingState";
import { StatsErrorState } from "./StatsErrorState";

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
  } = useStatsPage();

  if (isLoading && !overview) {
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
      />

      {/* Main Content Dashboard */}
      <div className={cn("space-y-8 transition-opacity duration-200", isLoading && "opacity-60")}>
        {/* KPI Cards */}
        <KPISection
          completionRate={overview?.completionRate}
          streak={overview?.streak}
        />

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

