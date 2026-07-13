import { useTranslation } from "@/hooks/use-translation";

interface GoalProgressBarProps {
  goalType: 'Binary' | 'Time-boxed' | 'Habit' | 'System';
  progressPct: number;
  durationMinutes?: number;
}

export function GoalProgressBar({ goalType, progressPct, durationMinutes }: GoalProgressBarProps) {
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";
  const pct = progressPct || 0;

  if (goalType === "Time-boxed") {
    return (
      <div className="text-sm text-muted-foreground mb-4 flex-1 flex flex-col">
        <div className="font-medium text-foreground mb-2 flex justify-between text-xs">
          <span>{t.goals.overallProgress}</span>
          <span className="text-primary font-bold">{Math.round(pct)}%</span>
        </div>
        <div className="w-full bg-secondary/50 rounded-full h-2 mb-1 overflow-hidden">
          <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }}></div>
        </div>
        <div className="mt-auto bg-muted/30 p-2 rounded-md text-xs text-center border border-border/30">
          {isVi ? (
            <>Mỗi lần thực hiện: <strong className="text-foreground">{durationMinutes || 0}</strong> phút</>
          ) : (
            <>Duration per execution: <strong className="text-foreground">{durationMinutes || 0}</strong> mins</>
          )}
        </div>
      </div>
    );
  }

  if (goalType === "Binary") {
    return (
      <div className="text-sm text-muted-foreground mb-4 flex-1 flex flex-col justify-center">
        <div className="font-medium text-foreground mb-2 flex justify-between text-xs">
          <span>{t.goals.projectProgress}</span>
          <span className="text-primary font-bold">{Math.round(pct)}%</span>
        </div>
        <div className="w-full bg-secondary/50 rounded-full h-2 mb-4 overflow-hidden mt-auto">
          <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  }

  return null;
}
