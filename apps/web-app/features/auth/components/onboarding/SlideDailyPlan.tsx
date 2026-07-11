import { useState } from "react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface SlideDailyPlanProps {
  wakeLabel: string;
  sleepLabel: string;
  totalHours: number;
  fixedH: number;
  bufferH: number;
  freeH: number;
}

export function SlideDailyPlan({ wakeLabel, sleepLabel, totalHours, fixedH, bufferH, freeH }: SlideDailyPlanProps) {
  const { t } = useTranslation();
  const [simStep, setSimStep] = useState<1 | 2 | 3 | 4>(1);

  const fmt = (h: number) => Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;

  return (
    <>
      <div className="w-full flex items-center justify-center">
        <div className="w-full space-y-3 animate-fade-in">
          <style>{`
            @keyframes fadeUp{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
            .fade-up{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
            @keyframes taskPop{from{transform:scale(.88);opacity:0}to{transform:none;opacity:1}}
            .task-pop{animation:taskPop .35s cubic-bezier(.16,1,.3,1) both}
            @keyframes lockGlow{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}50%{box-shadow:0 0 14px 4px rgba(16,185,129,.18)}}
            .lock-glow{animation:lockGlow 2.4s ease-in-out infinite}
          `}</style>

          {/* ── Step 1: total budget ── */}
          {simStep === 1 && (
            <div className="fade-up space-y-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="flex items-center gap-1">🌅 {t.onboarding.wake}: <strong className="text-foreground">{wakeLabel}</strong></span>
                <span className="flex items-center gap-1">🌌 {t.onboarding.sleep}: <strong className="text-foreground">{sleepLabel}</strong></span>
              </div>
              <div className="w-full h-20 rounded-2xl bg-primary/15 border border-primary/30 flex flex-col items-center justify-center gap-0.5">
                <span className="text-3xl font-bold text-primary">{fmt(totalHours)}</span>
                <span className="text-xs text-primary/70 font-medium">{t.onboarding.totalActiveHours}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">{t.onboarding.activeHoursDesc}</p>
            </div>
          )}

          {/* ── Step 2: subtract fixed + buffer ── */}
          {simStep === 2 && (
            <div className="fade-up space-y-2">
              {/* Equation rows */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground/40 w-5 shrink-0"> </span>
                  <div className="flex-1 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                    <span className="text-xs text-primary font-semibold">{t.onboarding.totalActiveLabel}</span>
                    <span className="text-sm font-bold text-primary">{fmt(totalHours)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 fade-up" style={{ animationDelay: "80ms" }}>
                  <span className="text-lg font-bold text-rose-400/70 w-5 shrink-0">−</span>
                  <div className="flex-1 flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-300 font-semibold">{t.onboarding.fixedScheduleLabel}</span>
                    <span className="text-sm font-bold text-slate-300">{fmt(fixedH)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 fade-up" style={{ animationDelay: "160ms" }}>
                  <span className="text-lg font-bold text-amber-400/70 w-5 shrink-0">−</span>
                  <div className="flex-1 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    <span className="text-xs text-amber-300 font-semibold">{t.onboarding.bufferLabel}</span>
                    <span className="text-sm font-bold text-amber-300">{fmt(bufferH)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 fade-up" style={{ animationDelay: "240ms" }}>
                  <span className="text-lg font-bold text-emerald-400 w-5 shrink-0">=</span>
                  <div className="flex-1 flex items-center justify-between bg-emerald-500/15 border-2 border-emerald-500/40 rounded-xl px-3 py-2.5">
                    <span className="text-xs text-emerald-300 font-bold">{t.onboarding.freeTimeLabel}</span>
                    <span className="text-base font-extrabold text-emerald-400">{fmt(freeH)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: auto-schedule fills free time ── */}
          {simStep === 3 && (
            <div className="fade-up space-y-2">
              <p className="text-[11px] text-center text-muted-foreground">{t.onboarding.autoScheduleDesc(fmt(freeH))}</p>
              <div className="space-y-1.5">
                <div className="task-pop flex items-center gap-2.5 bg-rose-500/15 border border-rose-500/25 rounded-xl px-3 py-2.5" style={{ animationDelay: "0ms" }}>
                  <span className="text-lg">🔥</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-rose-300 truncate">{t.onboarding.mockTask1Title}</p>
                    <p className="text-[10px] text-rose-400/60">{t.onboarding.mockTask1Desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400/80 shrink-0">09:00–11:00</span>
                </div>
                <div className="task-pop flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-3 py-2.5" style={{ animationDelay: "100ms" }}>
                  <span className="text-lg">★</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-300 truncate">{t.onboarding.mockTask2Title}</p>
                    <p className="text-[10px] text-emerald-400/60">{t.onboarding.mockTask2Desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 shrink-0">13:00–16:00</span>
                </div>
                <div className="task-pop flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl px-3 py-2.5" style={{ animationDelay: "200ms" }}>
                  <span className="text-lg">★</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-300/80 truncate">{t.onboarding.mockTask3Title}</p>
                    <p className="text-[10px] text-emerald-400/50">{t.onboarding.mockTask3Desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/60 shrink-0">20:00–20:30</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: lock & flow ── */}
          {simStep === 4 && (
            <div className="fade-up space-y-3">
              <div className="lock-glow w-full bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl px-4 py-5 flex flex-col items-center gap-2">
                <span className="text-4xl">🔒</span>
                <p className="text-sm font-bold text-emerald-400">{t.onboarding.planLocked}</p>
                <p className="text-xs text-emerald-300/70 text-center">{t.onboarding.flowModeDesc}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 px-1 w-full">
        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
          {t.onboarding.dailyPlanTitle}
        </DialogTitle>
        <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground">
          <div className="w-full space-y-3 mt-1">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500", simStep >= s ? (simStep === 4 ? "w-5 bg-emerald-400" : "w-5 bg-primary") : "w-2 bg-muted-foreground/25")} />
              ))}
            </div>

            {/* Action button */}
            <div>
              {simStep === 1 && (
                <Button onClick={() => setSimStep(2)} size="sm" className="w-full h-8 rounded-xl font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                  {t.onboarding.calcFreeTimeBtn}
                </Button>
              )}
              {simStep === 2 && (
                <Button onClick={() => setSimStep(3)} size="sm" className="w-full h-8 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
                  {t.onboarding.runAutoScheduleBtn}
                </Button>
              )}
              {simStep === 3 && (
                <Button onClick={() => setSimStep(4)} size="sm" className="w-full h-8 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md">
                  {t.onboarding.lockAndStartBtn}
                </Button>
              )}
              {simStep === 4 && (
                <Button variant="ghost" size="sm" onClick={() => setSimStep(1)} className="w-full h-8 rounded-xl font-medium text-xs text-muted-foreground hover:text-foreground hover:bg-muted/10">
                  {t.onboarding.restartBtn}
                </Button>
              )}
            </div>
          </div>
        </DialogDescription>
      </div>
    </>
  );
}
