"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Sparkles, ArrowRight } from "lucide-react";

export function EisenhowerSimulator() {
  const { t } = useTranslation();
  const guide = t.eisenhowerGuide;

  const [taskName, setTaskName] = useState("");
  const [isImportant, setIsImportant] = useState<boolean | null>(true);
  const [isUrgent, setIsUrgent] = useState<boolean | null>(false);

  // Result mapping
  const getResult = () => {
    if (isImportant === null || isUrgent === null) return null;
    if (isImportant && isUrgent) {
      return {
        quadrant: "Q1",
        label: guide.q1Title,
        badge: guide.q1ActionBadge,
        colorBg: "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400",
        advice: guide.q1MyPaceTip,
      };
    }
    if (isImportant && !isUrgent) {
      return {
        quadrant: "Q2",
        label: guide.q2Title,
        badge: guide.q2ActionBadge,
        colorBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        advice: guide.q2MyPaceTip,
      };
    }
    if (!isImportant && isUrgent) {
      return {
        quadrant: "Q3",
        label: guide.q3Title,
        badge: guide.q3ActionBadge,
        colorBg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        advice: guide.q3MyPaceTip,
      };
    }
    return {
      quadrant: "Q4",
      label: guide.q4Title,
      badge: guide.q4ActionBadge,
      colorBg: "bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400",
      advice: guide.q4MyPaceTip,
    };
  };

  const result = getResult();

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            {guide.simulatorTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {guide.simulatorSubtitle}
        </p>
      </div>

      {/* ── Task Name Input ── */}
      <div className="space-y-1.5">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder={guide.simulatorTaskPlaceholder}
          className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* ── 2 Questions Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Question 1: Important */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">
              {guide.simulatorIsImportantQuestion}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {guide.simulatorIsImportantDesc}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsImportant(true)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                isImportant === true
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              ✓ Có (Quan trọng)
            </button>
            <button
              type="button"
              onClick={() => setIsImportant(false)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                isImportant === false
                  ? "bg-slate-500/15 border-slate-500/40 text-foreground ring-2 ring-slate-500/20"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              ✕ Không
            </button>
          </div>
        </div>

        {/* Question 2: Urgent */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">
              {guide.simulatorIsUrgentQuestion}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {guide.simulatorIsUrgentDesc}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsUrgent(true)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                isUrgent === true
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-500 dark:text-rose-400 ring-2 ring-rose-500/20"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              ⚡ Có (Khẩn cấp)
            </button>
            <button
              type="button"
              onClick={() => setIsUrgent(false)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                isUrgent === false
                  ? "bg-slate-500/15 border-slate-500/40 text-foreground ring-2 ring-slate-500/20"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              ✕ Không
            </button>
          </div>
        </div>
      </div>

      {/* ── Instant Recommendation Result ── */}
      {result && (
        <div className={cn("rounded-xl border p-4 space-y-2 animate-fade-in", result.colorBg)}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {guide.simulatorResultPrefix}
              </span>
              <span className="text-sm font-bold text-foreground">
                {taskName.trim() ? `"${taskName.trim()}" → ` : ""}{result.label}
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-card/80 text-foreground">
              {result.badge}
            </span>
          </div>

          <div className="text-xs text-foreground/90 font-medium pt-1 flex items-start gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <p className="leading-snug">
              <strong className="text-foreground">{guide.simulatorMyPaceSetting} </strong>
              {result.advice}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
