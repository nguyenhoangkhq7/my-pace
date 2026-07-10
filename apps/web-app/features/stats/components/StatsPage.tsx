"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStatsPage } from "../hooks/useStatsPage";
import { StatsHeaderSection } from "./StatsHeaderSection";
import { KPISection } from "./KPISection";
import { EisenhowerMatrixChart } from "./EisenhowerMatrixChart";
import { CategoryChart } from "./CategoryChart";

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
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-rose-400">
        <div className="flex items-center gap-2 bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
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
