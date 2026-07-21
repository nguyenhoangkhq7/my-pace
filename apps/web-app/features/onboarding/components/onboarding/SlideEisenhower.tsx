import { useState } from "react";
import { cn } from "@/lib/utils";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

export function SlideEisenhower() {
  const { t } = useTranslation();
  const [selectedQ, setSelectedQ] = useState<"Q1" | "Q2" | "Q3" | "Q4" | null>(null);

  const handleQClick = (q: "Q1" | "Q2" | "Q3" | "Q4") => setSelectedQ((p) => p === q ? null : q);

  return (
    <>
      <div className="w-full flex items-center justify-center" style={{ minHeight: "10rem" }}>
        <div className="grid grid-cols-2 gap-2 w-40 h-40 relative animate-fade-in">
          <style>{`
            @keyframes bpQ1{0%,100%{border-color:rgba(244,63,94,.3)}50%{border-color:rgba(244,63,94,.85);box-shadow:0 0 10px 2px rgba(244,63,94,.15)}}
            @keyframes bpQ2{0%,100%{border-color:rgba(16,185,129,.35)}50%{border-color:rgba(16,185,129,.9);box-shadow:0 0 12px 2px rgba(16,185,129,.2)}}
            @keyframes bpQ3{0%,100%{border-color:rgba(245,158,11,.3)}50%{border-color:rgba(245,158,11,.85);box-shadow:0 0 10px 2px rgba(245,158,11,.15)}}
            @keyframes bpQ4{0%,100%{border-color:rgba(148,163,184,.2)}50%{border-color:rgba(148,163,184,.6);box-shadow:0 0 8px 1px rgba(148,163,184,.1)}}
            .cta-pulse-q1{animation:bpQ1 2s ease-in-out infinite}
            .cta-pulse-q2{animation:bpQ2 2s ease-in-out infinite}
            .cta-pulse-q3{animation:bpQ3 2s ease-in-out infinite}
            .cta-pulse-q4{animation:bpQ4 2s ease-in-out infinite}
          `}</style>
          <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-xl -z-10" />
          <button type="button" onClick={() => handleQClick("Q1")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer", selectedQ === "Q1" ? "border-rose-500 bg-rose-500/25 text-rose-400 ring-2 ring-rose-500/20 scale-105 z-10" : selectedQ === null ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:scale-105 cta-pulse-q1" : "border-rose-500/10 bg-rose-500/5 text-rose-400/40 opacity-40")}>
            <span className="text-[11px]">{t.eisenhower.q1Label}</span><span className="text-[8px] mt-0.5">{t.eisenhower.q1Sub}</span><span className="text-[7px] opacity-60">{t.eisenhower.q1Action}</span>
          </button>
          <button type="button" onClick={() => handleQClick("Q2")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer relative overflow-hidden", selectedQ === "Q2" ? "border-emerald-500 bg-emerald-500/25 text-emerald-400 ring-2 ring-emerald-500/20 scale-105 z-10" : selectedQ === null ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:scale-105 cta-pulse-q2" : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400/40 opacity-40")}>
            <span className="text-[11px]">{t.eisenhower.q2Label}</span><span className="text-[8px] mt-0.5">{t.eisenhower.q2Sub}</span><span className="text-[7px] opacity-70">{t.eisenhower.q2Action}</span>
            <div className="absolute right-0.5 bottom-0.5 text-[8px] text-emerald-400">★</div>
          </button>
          <button type="button" onClick={() => handleQClick("Q3")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer", selectedQ === "Q3" ? "border-amber-500 bg-amber-500/25 text-amber-400 ring-2 ring-amber-500/20 scale-105 z-10" : selectedQ === null ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:scale-105 cta-pulse-q3" : "border-amber-500/10 bg-amber-500/5 text-amber-400/40 opacity-40")}>
            <span className="text-[11px]">{t.eisenhower.q3Label}</span><span className="text-[8px] mt-0.5">{t.eisenhower.q3Sub}</span><span className="text-[7px] opacity-60">{t.eisenhower.q3Action}</span>
          </button>
          <button type="button" onClick={() => handleQClick("Q4")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer", selectedQ === "Q4" ? "border-slate-400 bg-slate-800 text-slate-200 ring-2 ring-slate-400/20 scale-105 z-10" : selectedQ === null ? "border-slate-700 bg-slate-900/50 text-slate-400 hover:scale-105 cta-pulse-q4" : "border-slate-900 bg-slate-950/20 text-slate-500/50 opacity-40")}>
            <span className="text-[11px]">{t.eisenhower.q4Label}</span><span className="text-[8px] mt-0.5">{t.eisenhower.q4Sub}</span><span className="text-[7px] opacity-60">{t.eisenhower.q4Action}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 px-1 w-full">
        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
          {t.eisenhower.title}
        </DialogTitle>
        <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground">
          <div className="text-left space-y-3 mt-1 w-full text-xs">
            {selectedQ === null ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-center flex items-center justify-center gap-1">
                  {t.eisenhower.clickToSeeDetails}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-0.5">
                    <p className="font-semibold text-rose-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />{t.eisenhower.q1Label}: {t.eisenhower.q1Action}</p>
                    <p className="text-[11px] text-muted-foreground/80">{t.eisenhower.q1Sub} &amp; Quan trọng.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5 relative">
                    <p className="font-semibold text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{t.eisenhower.q2Label}: {t.eisenhower.q2Action}</p>
                    <p className="text-[11px] text-muted-foreground/80 font-medium">Quan trọng, không gấp.</p>
                    <span className="absolute top-1.5 right-1.5 text-[7px] bg-emerald-500/15 text-emerald-400 font-bold px-1 rounded">{t.eisenhower.focus}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-0.5">
                    <p className="font-semibold text-amber-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t.eisenhower.q3Label}: {t.eisenhower.q3Action}</p>
                    <p className="text-[11px] text-muted-foreground/80">Gấp, không quan trọng.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                    <p className="font-semibold text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{t.eisenhower.q4Label}: {t.eisenhower.q4Action}</p>
                    <p className="text-[11px] text-muted-foreground/80 font-medium">Không gấp, không quan trọng.</p>
                  </div>
                </div>
                <p className="text-[11px] text-primary/70 italic text-center">{t.eisenhower.autoPriorityTip}</p>
              </div>
            ) : (
              <div className="animate-fade-in space-y-3">
                {selectedQ === "Q1" && (
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-rose-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />{t.eisenhower.q1Label} — {t.eisenhower.q1Sub} &amp; Quan trọng</h4>
                      <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed">{t.eisenhower.q1Desc}</p>
                    <div className="bg-rose-500/10 rounded-xl px-3 py-2 space-y-1">
                      <p className="text-[10.5px] font-semibold text-rose-300">📋 {t.eisenhower.q1Examples.split('\n')[0].replace('📋 ', '')}</p>
                      <p className="text-[10.5px] text-muted-foreground">
                        {t.eisenhower.q1Examples.split('\n').slice(1).map((line, idx) => (
                          <span key={idx} className="block">{line}</span>
                        ))}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.eisenhower.q1Pace}</p>
                  </div>
                )}
                {selectedQ === "Q2" && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{t.eisenhower.q2Label} — Quan trọng, chưa gấp <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">{t.eisenhower.focus}</span></h4>
                      <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed">{t.eisenhower.q2Desc}</p>
                    <div className="bg-emerald-500/10 rounded-xl px-3 py-2 space-y-1">
                      <p className="text-[10.5px] font-semibold text-emerald-300">📋 {t.eisenhower.q2Examples.split('\n')[0].replace('📋 ', '')}</p>
                      <p className="text-[10.5px] text-muted-foreground">
                        {t.eisenhower.q2Examples.split('\n').slice(1).map((line, idx) => (
                          <span key={idx} className="block">{line}</span>
                        ))}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.eisenhower.q2Pace}</p>
                  </div>
                )}
                {selectedQ === "Q3" && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-amber-400" />{t.eisenhower.q3Label} — {t.eisenhower.q3Sub}, không quan trọng</h4>
                      <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed">{t.eisenhower.q3Desc}</p>
                    <div className="bg-amber-500/10 rounded-xl px-3 py-2 space-y-1">
                      <p className="text-[10.5px] font-semibold text-amber-300">📋 {t.eisenhower.q3Examples.split('\n')[0].replace('📋 ', '')}</p>
                      <p className="text-[10.5px] text-muted-foreground">
                        {t.eisenhower.q3Examples.split('\n').slice(1).map((line, idx) => (
                          <span key={idx} className="block">{line}</span>
                        ))}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.eisenhower.q3Pace}</p>
                  </div>
                )}
                {selectedQ === "Q4" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-slate-500" />{t.eisenhower.q4Label} — {t.eisenhower.q4Sub}, không quan trọng</h4>
                      <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed">{t.eisenhower.q4Desc}</p>
                    <div className="bg-slate-800/60 rounded-xl px-3 py-2 space-y-1">
                      <p className="text-[10.5px] font-semibold text-slate-300">📋 {t.eisenhower.q4Examples.split('\n')[0].replace('📋 ', '')}</p>
                      <p className="text-[10.5px] text-muted-foreground">
                        {t.eisenhower.q4Examples.split('\n').slice(1).map((line, idx) => (
                          <span key={idx} className="block">{line}</span>
                        ))}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.eisenhower.q4Pace}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogDescription>
      </div>
    </>
  );
}
