"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "../store/onboarding.store";
import { useAuthStore } from "../store/auth.store";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OnboardingModal() {
  const {
    isOpen,
    currentSlide,
    hasCompletedOnboarding,
    isHelpMode,
    startOnboarding,
    nextSlide,
    prevSlide,
    completeOnboarding,
  } = useOnboardingStore();

  const [selectedQ, setSelectedQ] = useState<"Q1" | "Q2" | "Q3" | "Q4" | null>(null);
  const [simStep, setSimStep] = useState<1 | 2 | 3 | 4>(1);

  const user = useAuthStore((s) => s.user);
  const wakeLabel = user?.wakeTime ? user.wakeTime.substring(0, 5) : "07:00";
  const sleepLabel = user?.sleepTime ? user.sleepTime.substring(0, 5) : "23:00";
  const [wakeH, wakeM] = wakeLabel.split(":").map(Number);
  const [sleepH, sleepM] = sleepLabel.split(":").map(Number);
  const totalMins = Math.max(60, sleepH * 60 + sleepM - (wakeH * 60 + wakeM));
  const totalHours = totalMins / 60;
  // Simulate: fixed events = 2h, buffer = 20% of total, free = rest
  const fixedH = 2;
  const bufferH = Math.round(totalHours * 0.2 * 10) / 10;
  const freeH = Math.round((totalHours - fixedH - bufferH) * 10) / 10;
  const fmt = (h: number) => Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;

  useEffect(() => {
    if (!hasCompletedOnboarding) startOnboarding();
  }, [hasCompletedOnboarding, startOnboarding]);

  useEffect(() => {
    if (isOpen) { setSelectedQ(null); setSimStep(1); }
  }, [isOpen, currentSlide]);

  const totalSlides = 3;
  const handleQClick = (q: "Q1" | "Q2" | "Q3" | "Q4") => setSelectedQ((p) => p === q ? null : q);
  const handleNext = () => currentSlide === totalSlides - 1 ? completeOnboarding() : nextSlide();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) completeOnboarding(); }}>
      <DialogContent
        showCloseButton={isHelpMode}
        className="sm:max-w-[520px] max-w-lg rounded-3xl p-6 border-none bg-card shadow-2xl overflow-y-auto max-h-[90vh] duration-300 scrollbar-thin"
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">

          {/* ══ ILLUSTRATION ══ */}
          <div className="w-full flex items-center justify-center" style={{ minHeight: currentSlide === 2 ? "auto" : "10rem" }}>

            {/* Slide 0: MITs focus target */}
            {currentSlide === 0 && (
              <div className="relative flex items-center justify-center animate-fade-in">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl h-28 w-28 -z-10" />
                <svg className="w-24 h-24 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" className="opacity-80" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <path d="M5 5L7 7M19 5L17 7M5 19L7 17M19 19L17 17" strokeLinecap="round" />
                </svg>
                <div className="absolute top-2 right-2 text-amber-500 animate-bounce">★</div>
                <div className="absolute bottom-2 left-2 text-amber-500 animate-bounce delay-300">★</div>
              </div>
            )}

            {/* Slide 1: Eisenhower matrix */}
            {currentSlide === 1 && (
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
                  <span className="text-[11px]">Q1</span><span className="text-[8px] mt-0.5">Khẩn cấp</span><span className="text-[7px] opacity-60">Làm ngay</span>
                </button>
                <button type="button" onClick={() => handleQClick("Q2")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer relative overflow-hidden", selectedQ === "Q2" ? "border-emerald-500 bg-emerald-500/25 text-emerald-400 ring-2 ring-emerald-500/20 scale-105 z-10" : selectedQ === null ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:scale-105 cta-pulse-q2" : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400/40 opacity-40")}>
                  <span className="text-[11px]">Q2</span><span className="text-[8px] mt-0.5">Tiêu điểm</span><span className="text-[7px] opacity-70">Kế hoạch</span>
                  <div className="absolute right-0.5 bottom-0.5 text-[8px] text-emerald-400">★</div>
                </button>
                <button type="button" onClick={() => handleQClick("Q3")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer", selectedQ === "Q3" ? "border-amber-500 bg-amber-500/25 text-amber-400 ring-2 ring-amber-500/20 scale-105 z-10" : selectedQ === null ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:scale-105 cta-pulse-q3" : "border-amber-500/10 bg-amber-500/5 text-amber-400/40 opacity-40")}>
                  <span className="text-[11px]">Q3</span><span className="text-[8px] mt-0.5">Ủy quyền</span><span className="text-[7px] opacity-60">Hạn chế</span>
                </button>
                <button type="button" onClick={() => handleQClick("Q4")} className={cn("border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 cursor-pointer", selectedQ === "Q4" ? "border-slate-400 bg-slate-800 text-slate-200 ring-2 ring-slate-400/20 scale-105 z-10" : selectedQ === null ? "border-slate-700 bg-slate-900/50 text-slate-400 hover:scale-105 cta-pulse-q4" : "border-slate-900 bg-slate-950/20 text-slate-500/50 opacity-40")}>
                  <span className="text-[11px]">Q4</span><span className="text-[8px] mt-0.5">Giải trí</span><span className="text-[7px] opacity-60">Loại bỏ</span>
                </button>
              </div>
            )}

            {/* Slide 2: Daily Plan visual equation */}
            {currentSlide === 2 && (
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
                      <span className="flex items-center gap-1">🌅 Thức: <strong className="text-foreground">{wakeLabel}</strong></span>
                      <span className="flex items-center gap-1">🌌 Ngủ: <strong className="text-foreground">{sleepLabel}</strong></span>
                    </div>
                    <div className="w-full h-20 rounded-2xl bg-primary/15 border border-primary/30 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-3xl font-bold text-primary">{fmt(totalHours)}</span>
                      <span className="text-xs text-primary/70 font-medium">tổng giờ hoạt động / ngày</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Đây là quỹ thời gian của bạn. Tiếp theo, ta sẽ tính xem còn bao nhiêu giờ thực sự rảnh để làm việc.</p>
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
                          <span className="text-xs text-primary font-semibold">⏰ Tổng giờ hoạt động</span>
                          <span className="text-sm font-bold text-primary">{fmt(totalHours)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 fade-up" style={{ animationDelay: "80ms" }}>
                        <span className="text-lg font-bold text-rose-400/70 w-5 shrink-0">−</span>
                        <div className="flex-1 flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
                          <span className="text-xs text-slate-300 font-semibold">📅 Lịch cố định (Học ở trường, làm việc, ...)</span>
                          <span className="text-sm font-bold text-slate-300">{fmt(fixedH)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 fade-up" style={{ animationDelay: "160ms" }}>
                        <span className="text-lg font-bold text-amber-400/70 w-5 shrink-0">−</span>
                        <div className="flex-1 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                          <span className="text-xs text-amber-300 font-semibold">🛡️ Buffer 20% (nghỉ ngơi)</span>
                          <span className="text-sm font-bold text-amber-300">{fmt(bufferH)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 fade-up" style={{ animationDelay: "240ms" }}>
                        <span className="text-lg font-bold text-emerald-400 w-5 shrink-0">=</span>
                        <div className="flex-1 flex items-center justify-between bg-emerald-500/15 border-2 border-emerald-500/40 rounded-xl px-3 py-2.5">
                          <span className="text-xs text-emerald-300 font-bold">✅ Thời gian rảnh để làm việc</span>
                          <span className="text-base font-extrabold text-emerald-400">{fmt(freeH)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 3: auto-schedule fills free time ── */}
                {simStep === 3 && (
                  <div className="fade-up space-y-2">
                    <p className="text-[11px] text-center text-muted-foreground">Thuật toán tự động xếp task vào <strong className="text-foreground">{fmt(freeH)} rảnh</strong> theo thứ tự ưu tiên:</p>
                    <div className="space-y-1.5">
                      <div className="task-pop flex items-center gap-2.5 bg-rose-500/15 border border-rose-500/25 rounded-xl px-3 py-2.5" style={{ animationDelay: "0ms" }}>
                        <span className="text-lg">🔥</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-rose-300 truncate">Hoàn thành báo cáo tuần</p>
                          <p className="text-[10px] text-rose-400/60">Q1 · 2 giờ</p>
                        </div>
                        <span className="text-[10px] font-mono text-rose-400/80 shrink-0">09:00–11:00</span>
                      </div>
                      <div className="task-pop flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-3 py-2.5" style={{ animationDelay: "100ms" }}>
                        <span className="text-lg">★</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-300 truncate">Học kỹ năng mới (TypeScript)</p>
                          <p className="text-[10px] text-emerald-400/60">Q2 · 3 giờ</p>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400/80 shrink-0">13:00–16:00</span>
                      </div>
                      <div className="task-pop flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl px-3 py-2.5" style={{ animationDelay: "200ms" }}>
                        <span className="text-lg">★</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-300/80 truncate">Đọc sách 30 phút</p>
                          <p className="text-[10px] text-emerald-400/50">Q2 · 0.5 giờ</p>
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
                      <p className="text-sm font-bold text-emerald-400">Kế hoạch đã được khóa!</p>
                      <p className="text-xs text-emerald-300/70 text-center">Bạn đang ở chế độ <strong className="text-emerald-300">Flow</strong> — tập trung 100%, không được phép chỉnh sửa kế hoạch.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ TITLE + DESCRIPTION ══ */}
          <div className="space-y-2 px-1 w-full">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
              {currentSlide === 0 ? "Triết lý MITs"
                : currentSlide === 1 ? "Ma trận Eisenhower"
                : "Kế hoạch ngày (Daily Plan)"}
            </DialogTitle>

            <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground">

              {/* SLIDE 0 */}
              {currentSlide === 0 ? (
                <div className="text-sm text-center">
                  {isHelpMode ? (
                    <><strong className="text-foreground">Triết lý MITs</strong> giúp loại bỏ sự phân tâm. Giới hạn 1–3 việc quan trọng nhất mỗi ngày để đảm bảo năng lượng tập trung vào mục tiêu tạo tác động lớn nhất.</>
                  ) : (
                    <>Thay vì gồng gánh danh sách dài, mỗi ngày chỉ cam kết hoàn thành <span className="text-foreground font-semibold">1–3 việc thực sự quan trọng (MITs)</span> trước. Điều này bảo vệ tiêu điểm và duy trì động lực.</>
                  )}
                </div>

              ) : currentSlide === 1 ? (
                /* SLIDE 1: Eisenhower description */
                <div className="text-left space-y-3 mt-1 w-full text-xs">
                  {selectedQ === null ? (
                    <div className="space-y-3 animate-fade-in">
                      <p className="text-center flex items-center justify-center gap-1">
                        Bấm vào từng ô để xem chi tiết
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-0.5">
                          <p className="font-semibold text-rose-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />Q1: Làm ngay</p>
                          <p className="text-[11px] text-muted-foreground/80">Khẩn cấp & Quan trọng.</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5 relative">
                          <p className="font-semibold text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Q2: Lên lịch</p>
                          <p className="text-[11px] text-muted-foreground/80 font-medium">Quan trọng, không gấp.</p>
                          <span className="absolute top-1.5 right-1.5 text-[7px] bg-emerald-500/15 text-emerald-400 font-bold px-1 rounded">Trọng tâm</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-0.5">
                          <p className="font-semibold text-amber-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Q3: Ủy quyền</p>
                          <p className="text-[11px] text-muted-foreground/80">Gấp, không quan trọng.</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                          <p className="font-semibold text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Q4: Loại bỏ</p>
                          <p className="text-[11px] text-muted-foreground/80">Không gấp, không quan trọng.</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-primary/70 italic text-center">💡 Auto-Schedule ưu tiên: Q1 → Q2 → Q3 → Q4</p>
                    </div>
                  ) : (
                    <div className="animate-fade-in space-y-3">
                      {selectedQ === "Q1" && (
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-2.5 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-rose-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />Q1 — Khẩn cấp & Quan trọng</h4>
                            <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground leading-relaxed">Đây là những việc <strong className="text-rose-300">bắt buộc phải xử lý ngay hôm nay</strong> — deadline gấp, sự cố kỹ thuật, bài thi sắp tới. Trì hoãn sẽ gây hậu quả nghiêm trọng.</p>
                          <div className="bg-rose-500/10 rounded-xl px-3 py-2 space-y-1">
                            <p className="text-[10.5px] font-semibold text-rose-300">📋 Ví dụ thực tế</p>
                            <p className="text-[10.5px] text-muted-foreground">• Nộp báo cáo deadline hôm nay<br/>• Sửa lỗi production đang ảnh hưởng user<br/>• Ôn thi có lịch thi ngày mai</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Tích cả <span className="text-rose-400 font-semibold">"Quan trọng"</span> và <span className="text-rose-400 font-semibold">"Khẩn cấp"</span> khi tạo task. Auto-Schedule sẽ xếp Q1 vào <strong>đầu tiên</strong> trong ngày.</p>
                        </div>
                      )}
                      {selectedQ === "Q2" && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Q2 — Quan trọng, chưa gấp <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Trọng tâm</span></h4>
                            <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground leading-relaxed"><strong className="text-emerald-300">Đây là vùng tăng trưởng thực sự</strong> — học kỹ năng mới, xây dựng sức khỏe, phát triển bản thân. Không ai thúc ép, nhưng đây mới là điều thay đổi cuộc đời bạn.</p>
                          <div className="bg-emerald-500/10 rounded-xl px-3 py-2 space-y-1">
                            <p className="text-[10.5px] font-semibold text-emerald-300">📋 Ví dụ thực tế</p>
                            <p className="text-[10.5px] text-muted-foreground">• Học lập trình / ngoại ngữ mỗi ngày<br/>• Tập gym, thiền định, đọc sách<br/>• Xây dựng portfolio, side project</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Chỉ tích <span className="text-emerald-400 font-semibold">"Quan trọng"</span> (bỏ trống "Khẩn cấp"). Làm Q2 đều đặn giúp bạn <strong>không bao giờ rơi vào khủng hoảng Q1</strong>.</p>
                        </div>
                      )}
                      {selectedQ === "Q3" && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2.5 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-amber-400" />Q3 — Gấp, không quan trọng</h4>
                            <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground leading-relaxed">Trông có vẻ gấp nhưng thực ra <strong className="text-amber-300">không đóng góp cho mục tiêu của bạn</strong>. Đây là bẫy năng suất — bạn bận rộn cả ngày mà chẳng tiến về phía mục tiêu thực sự.</p>
                          <div className="bg-amber-500/10 rounded-xl px-3 py-2 space-y-1">
                            <p className="text-[10.5px] font-semibold text-amber-300">📋 Ví dụ thực tế</p>
                            <p className="text-[10.5px] text-muted-foreground">• Trả lời email không quan trọng<br/>• Dự họp mà mình không cần có mặt<br/>• Giúp người khác việc không liên quan đến goal</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Chỉ tích <span className="text-amber-400 font-semibold">"Khẩn cấp"</span> (bỏ trống "Quan trọng"). Hãy ủy quyền hoặc giải quyết thật nhanh — <strong>đừng để Q3 ăn vào thời gian Q2</strong>.</p>
                        </div>
                      )}
                      {selectedQ === "Q4" && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-400 flex items-center gap-1.5 text-sm"><span className="w-2 h-2 rounded-full bg-slate-500" />Q4 — Không gấp, không quan trọng</h4>
                            <button type="button" onClick={() => setSelectedQ(null)} className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground leading-relaxed">Những hoạt động <strong className="text-slate-300">lãng phí thời gian thuần túy</strong> — không tạo ra giá trị, không giúp bạn tiến gần hơn đến mục tiêu. Cần nhận diện và loại bỏ.</p>
                          <div className="bg-slate-800/60 rounded-xl px-3 py-2 space-y-1">
                            <p className="text-[10.5px] font-semibold text-slate-300">📋 Ví dụ thực tế</p>
                            <p className="text-[10.5px] text-muted-foreground">• Lướt TikTok / mạng xã hội vô mục đích<br/>• Xem video không liên quan đến goal<br/>• Tán gẫu hoặc họp hành không cần thiết</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Để trống cả hai ô — Auto-Schedule sẽ xếp Q4 <strong>cuối cùng</strong>. Lý tưởng nhất: <span className="text-slate-300 font-semibold">loại bỏ hoàn toàn</span> khỏi kế hoạch.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              ) : (
                /* SLIDE 2: Daily Plan step controls */
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
                        Tính giờ rảnh còn lại
                      </Button>
                    )}
                    {simStep === 2 && (
                      <Button onClick={() => setSimStep(3)} size="sm" className="w-full h-8 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
                        Tự động xếp lịch (Auto-Schedule)
                      </Button>
                    )}
                    {simStep === 3 && (
                      <Button onClick={() => setSimStep(4)} size="sm" className="w-full h-8 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md">
                        Khóa kế hoạch & bắt đầu ngày mới
                      </Button>
                    )}
                    {simStep === 4 && (
                      <Button variant="ghost" size="sm" onClick={() => setSimStep(1)} className="w-full h-8 rounded-xl font-medium text-xs text-muted-foreground hover:text-foreground hover:bg-muted/10">
                        Trải nghiệm lại từ đầu
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </div>

          {/* ══ DOT INDICATORS ══ */}
          <div className="flex gap-1.5 justify-center pt-1">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div key={idx} className={cn("h-1.5 rounded-full transition-all duration-300", currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
            ))}
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <DialogFooter className="flex flex-row justify-between items-center w-full gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={prevSlide} disabled={currentSlide === 0}
            className={cn("h-11 rounded-xl font-medium", currentSlide === 0 && "opacity-0 pointer-events-none")}>
            Quay lại
          </Button>
          <Button type="button" onClick={handleNext}
            className="h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground transition-all active:scale-[0.98]">
            {currentSlide === totalSlides - 1 ? (isHelpMode ? "Đóng" : "Bắt đầu lên kế hoạch") : "Tiếp tục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
