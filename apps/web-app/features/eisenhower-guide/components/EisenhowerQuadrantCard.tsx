import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Flame, Sparkles, UserX, Trash2 } from "lucide-react";

interface QuadrantCardProps {
  quadrant: "Q1" | "Q2" | "Q3" | "Q4";
  title: string;
  subtitle: string;
  actionBadge: string;
  fullDesc: string;
  examples: string[];
  trap: string;
  myPaceTip: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

const QUADRANT_CONFIGS = {
  Q1: {
    icon: Flame,
    colorBorder: "border-rose-500/30 hover:border-rose-500/60",
    colorBg: "bg-rose-500/5",
    colorBadge: "bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30",
    colorHeading: "text-rose-500 dark:text-rose-400",
    colorDot: "bg-rose-500",
    ringActive: "ring-2 ring-rose-500/40",
  },
  Q2: {
    icon: Sparkles,
    colorBorder: "border-emerald-500/30 hover:border-emerald-500/60",
    colorBg: "bg-emerald-500/5",
    colorBadge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    colorHeading: "text-emerald-600 dark:text-emerald-400",
    colorDot: "bg-emerald-500",
    ringActive: "ring-2 ring-emerald-500/40",
  },
  Q3: {
    icon: UserX,
    colorBorder: "border-amber-500/30 hover:border-amber-500/60",
    colorBg: "bg-amber-500/5",
    colorBadge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    colorHeading: "text-amber-600 dark:text-amber-400",
    colorDot: "bg-amber-500",
    ringActive: "ring-2 ring-amber-500/40",
  },
  Q4: {
    icon: Trash2,
    colorBorder: "border-slate-500/30 hover:border-slate-500/60",
    colorBg: "bg-slate-500/5",
    colorBadge: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    colorHeading: "text-slate-600 dark:text-slate-400",
    colorDot: "bg-slate-500",
    ringActive: "ring-2 ring-slate-500/40",
  },
};

export function EisenhowerQuadrantCard({
  quadrant,
  title,
  subtitle,
  actionBadge,
  fullDesc,
  examples,
  trap,
  myPaceTip,
  isSelected,
  onSelect,
}: QuadrantCardProps) {
  const config = QUADRANT_CONFIGS[quadrant];
  const IconComponent = config.icon;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-2xl border p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between space-y-4",
        config.colorBorder,
        config.colorBg,
        isSelected && config.ringActive,
        onSelect && "cursor-pointer"
      )}
    >
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <IconComponent className={cn("w-4 h-4 shrink-0", config.colorHeading)} />
            <h3 className={cn("text-base font-bold tracking-tight", config.colorHeading)}>
              {title}
            </h3>
          </div>
          <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", config.colorBadge)}>
            {actionBadge}
          </span>
        </div>

        <p className="text-xs font-medium text-foreground/80">
          {subtitle}
        </p>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {fullDesc}
        </p>

        {/* Real-world Examples */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ví dụ thực tế
          </span>
          <ul className="space-y-1 text-xs text-muted-foreground/90">
            {examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0 opacity-70" />
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/40">
        {/* Trap Warning */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground/80 italic">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>{trap}</span>
        </div>

        {/* MyPACE Tip */}
        <div className="rounded-lg bg-card/60 border border-border/50 p-2.5 text-xs text-foreground/90 font-medium">
          <p className="leading-snug">{myPaceTip}</p>
        </div>
      </div>
    </div>
  );
}
