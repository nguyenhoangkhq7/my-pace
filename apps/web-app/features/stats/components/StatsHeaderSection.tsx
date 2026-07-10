import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatLabel } from "../utils/statsDateUtils";

interface StatsHeaderSectionProps {
  range: "week" | "month" | "year";
  setRange: (val: "week" | "month" | "year") => void;
  start: Date;
  end: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function StatsHeaderSection({
  range,
  setRange,
  start,
  end,
  onPrev,
  onNext,
}: StatsHeaderSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">Progress Analytics</h1>
        <p className="text-muted-foreground">Nhìn lại thời gian và tiến độ hoàn thành công việc của bạn.</p>
      </div>

      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1.5 shadow-md">
        <div className="flex items-center gap-3 px-2 border-r border-border/60">
          <button
            onClick={onPrev}
            className="p-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-foreground min-w-[150px] text-center">
            {formatLabel(start, end, range)}
          </span>
          <button
            onClick={onNext}
            className="p-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <Tabs value={range} onValueChange={(val) => setRange(val as "week" | "month" | "year")} className="w-fit">
          <TabsList className="bg-transparent border-0 text-muted-foreground h-8 p-0 flex gap-1">
            <TabsTrigger value="week" className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg cursor-pointer">Tuần</TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg cursor-pointer">Tháng</TabsTrigger>
            <TabsTrigger value="year" className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg cursor-pointer">Năm</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
