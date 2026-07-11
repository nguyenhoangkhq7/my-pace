import { Flame } from "lucide-react";

interface StatsTitleProps {
  title?: string;
  subtitle?: string;
  streak?: number;
}

export function StatsTitle({
  title = "Progress Analytics",
  subtitle = "Nhìn lại thời gian và tiến độ hoàn thành công việc của bạn.",
  streak = 0,
}: StatsTitleProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            <span>{streak} ngày</span>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );
}
