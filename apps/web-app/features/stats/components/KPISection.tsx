import { Flame, TrendingUp } from "lucide-react";

interface KPISectionProps {
  completionRate?: number;
  streak?: number;
}

export function KPISection({ completionRate = 0, streak = 0 }: KPISectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-lg">
      {/* Completion Rate Card */}
      <div className="bg-card rounded-xl p-3.5 border border-border shadow-md relative overflow-hidden group flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hoàn thành</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-foreground">{completionRate}</span>
            <span className="text-xs font-semibold text-emerald-400">%</span>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="bg-card rounded-xl p-3.5 border border-border shadow-md relative overflow-hidden group flex items-center gap-3">
        <div className="bg-orange-500/10 p-2 rounded-lg shrink-0">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Chuỗi streak</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-foreground">{streak}</span>
            <span className="text-xs font-semibold text-orange-400">ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
}
