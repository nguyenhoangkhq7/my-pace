"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "../store/onboarding.store";
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

  useEffect(() => {
    // If onboarding is not completed, trigger it to open
    if (!hasCompletedOnboarding) {
      startOnboarding();
    }
  }, [hasCompletedOnboarding, startOnboarding]);

  useEffect(() => {
    if (isOpen) {
      setSelectedQ(null);
    }
  }, [isOpen, currentSlide]);

  const totalSlides = 2;

  const handleQClick = (q: "Q1" | "Q2" | "Q3" | "Q4") => {
    setSelectedQ((prev) => (prev === q ? null : q));
  };

  const handleNext = () => {
    if (currentSlide === totalSlides - 1) {
      completeOnboarding();
    } else {
      nextSlide();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        completeOnboarding();
      }
    }}>
      <DialogContent showCloseButton={isHelpMode} className="sm:max-w-[550px] max-w-lg rounded-3xl p-6 border-none bg-card shadow-2xl overflow-y-auto max-h-[90vh] duration-300 scrollbar-thin">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          
          {/* Animated Illustration Container */}
          <div className="h-40 w-full flex items-center justify-center relative">
            {currentSlide === 0 ? (
              // Slide 1 Illustration (MITs Target / Stars)
              <div className="relative flex items-center justify-center animate-fade-in duration-300">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl h-28 w-28 -z-10" />
                <svg className="w-24 h-24 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" />
                  <circle cx="12" cy="12" r="6" stroke="currentColor" className="opacity-80" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  {/* Star decals */}
                  <path d="M5 5L7 7M19 5L17 7M5 19L7 17M19 19L17 17" strokeLinecap="round" />
                </svg>
                <div className="absolute top-2 right-2 text-amber-500 animate-bounce delay-150">★</div>
                <div className="absolute bottom-2 left-2 text-amber-500 animate-bounce delay-500">★</div>
              </div>
            ) : (
              // Slide 2 Illustration (Eisenhower Grid with all Qs styled as interactive buttons)
              <div className="grid grid-cols-2 gap-2 w-36 h-36 relative animate-fade-in duration-300">
                <style>{`
                  @keyframes borderPulseQ1 {
                    0%, 100% { border-color: rgba(244, 63, 94, 0.3); }
                    50% { border-color: rgba(244, 63, 94, 0.8); box-shadow: 0 0 10px 1px rgba(244, 63, 94, 0.15); }
                  }
                  @keyframes borderPulseQ2 {
                    0%, 100% { border-color: rgba(16, 185, 129, 0.4); }
                    50% { border-color: rgba(16, 185, 129, 0.9); box-shadow: 0 0 12px 2px rgba(16, 185, 129, 0.2); }
                  }
                  @keyframes borderPulseQ3 {
                    0%, 100% { border-color: rgba(245, 158, 11, 0.3); }
                    50% { border-color: rgba(245, 158, 11, 0.8); box-shadow: 0 0 10px 1px rgba(245, 158, 11, 0.15); }
                  }
                  @keyframes borderPulseQ4 {
                    0%, 100% { border-color: rgba(148, 163, 184, 0.2); }
                    50% { border-color: rgba(148, 163, 184, 0.6); box-shadow: 0 0 8px 1px rgba(148, 163, 184, 0.1); }
                  }
                  .cta-pulse-q1 { animation: borderPulseQ1 2s infinite ease-in-out; }
                  .cta-pulse-q2 { animation: borderPulseQ2 2s infinite ease-in-out; }
                  .cta-pulse-q3 { animation: borderPulseQ3 2s infinite ease-in-out; }
                  .cta-pulse-q4 { animation: borderPulseQ4 2s infinite ease-in-out; }
                `}</style>
                <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-xl -z-10" />
                
                {/* Q1: Urgent & Important */}
                <button
                  type="button"
                  onClick={() => handleQClick("Q1")}
                  className={cn(
                    "border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 text-left cursor-pointer",
                    selectedQ === "Q1" 
                      ? "border-rose-500 bg-rose-500/25 text-rose-400 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10 scale-105 z-10" 
                      : selectedQ === null
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15 hover:scale-105 hover:shadow-lg cta-pulse-q1"
                        : "border-rose-500/10 bg-rose-500/5 text-rose-400/50 opacity-40 hover:opacity-80"
                  )}
                >
                  <span className="text-[11px]">Q1</span>
                  <span className="text-[8px] font-semibold opacity-90 mt-0.5">Khẩn cấp</span>
                  <span className="text-[7px] opacity-60">Làm ngay</span>
                </button>

                {/* Q2: Important, Not Urgent (Highlighted with extra shadow) */}
                <button
                  type="button"
                  onClick={() => handleQClick("Q2")}
                  className={cn(
                    "border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 relative overflow-hidden text-left cursor-pointer",
                    selectedQ === "Q2" 
                      ? "border-emerald-500 bg-emerald-500/25 text-emerald-400 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 border-2 scale-105 z-10" 
                      : selectedQ === null
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 hover:scale-105 hover:shadow-lg cta-pulse-q2"
                        : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400/50 opacity-40 hover:opacity-80"
                  )}
                >
                  <span className="text-[11px]">Q2</span>
                  <span className="text-[8px] font-semibold opacity-90 mt-0.5">Tiêu điểm</span>
                  <span className="text-[7px] opacity-70">Kế hoạch</span>
                  <div className="absolute right-0.5 bottom-0.5 text-[8px] text-emerald-400 font-bold">★</div>
                </button>

                {/* Q3: Urgent, Not Important */}
                <button
                  type="button"
                  onClick={() => handleQClick("Q3")}
                  className={cn(
                    "border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 text-left cursor-pointer",
                    selectedQ === "Q3" 
                      ? "border-amber-500 bg-amber-500/25 text-amber-400 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10 scale-105 z-10" 
                      : selectedQ === null
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 hover:scale-105 hover:shadow-lg cta-pulse-q3"
                        : "border-amber-500/10 bg-amber-500/5 text-amber-400/50 opacity-40 hover:opacity-80"
                  )}
                >
                  <span className="text-[11px]">Q3</span>
                  <span className="text-[8px] font-semibold opacity-90 mt-0.5">Ủy quyền</span>
                  <span className="text-[7px] opacity-60">Hạn chế</span>
                </button>

                {/* Q4: Not Urgent & Not Important */}
                <button
                  type="button"
                  onClick={() => handleQClick("Q4")}
                  className={cn(
                    "border rounded-lg flex flex-col items-center justify-center font-bold p-1 transition-all active:scale-95 text-left cursor-pointer",
                    selectedQ === "Q4" 
                      ? "border-slate-400 bg-slate-800 text-slate-200 ring-2 ring-slate-400/20 shadow-lg scale-105 z-10" 
                      : selectedQ === null
                        ? "border-slate-700 bg-slate-900/50 text-slate-400 hover:bg-slate-900 hover:scale-105 cta-pulse-q4"
                        : "border-slate-900 bg-slate-950/20 text-slate-500 opacity-40 hover:opacity-80"
                  )}
                >
                  <span className="text-[11px]">Q4</span>
                  <span className="text-[8px] font-semibold opacity-90 mt-0.5">Giải trí</span>
                  <span className="text-[7px] opacity-60">Loại bỏ</span>
                </button>
              </div>
            )}
          </div>

          {/* Slide Text Content */}
          <div className="space-y-3 px-2 w-full">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
              {currentSlide === 0 ? "Triết lý MITs" : "Ma trận Eisenhower"}
            </DialogTitle>
            <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground min-h-[72px]">
              {currentSlide === 0 ? (
                <div className="text-sm">
                  {isHelpMode ? (
                    <>
                      <strong className="text-foreground">Triết lý MITs (Most Important Tasks)</strong> giúp loại bỏ sự phân tâm. Bằng cách giới hạn từ 1-3 việc quan trọng nhất mỗi ngày, bạn đảm bảo năng lượng của mình tập trung vào những mục tiêu tạo ra tác động lớn nhất, tránh bị cuốn vào các việc vặt vãnh.
                    </>
                  ) : (
                    <>
                      Thay vì gồng gánh một danh sách dài vô tận gây quá tải, mỗi ngày bạn chỉ nên cam kết hoàn thành <span className="text-foreground font-semibold">1 đến 3 việc thực sự quan trọng (MITs)</span> trước. Điều này giúp bảo vệ tiêu điểm và duy trì động lực tốt nhất.
                    </>
                  )}
                </div>
              ) : (
                <div className="text-left space-y-4 mt-1 w-full text-xs leading-relaxed">
                  {/* Selected Quadrant Detailed Card */}
                  {selectedQ === null ? (
                    <div className="space-y-4 w-full animate-fade-in duration-300">
                      {/* <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1">
                          <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                            Q1: Làm ngay (Do)
                          </div>
                          <p className="text-[11px] leading-normal text-muted-foreground/80">Khẩn cấp & Quan trọng (hạn chót gấp, khủng hoảng đột xuất).</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 relative shadow-inner">
                          <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Q2: Lên lịch (Plan)
                          </div>
                          <p className="text-[11px] leading-normal text-muted-foreground/80 font-medium">Quan trọng, Không khẩn cấp (học tập, mục tiêu dài hạn, sức khỏe).</p>
                          <div className="absolute top-1 right-2 text-[7px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1 rounded">Trọng tâm</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-1">
                          <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Q3: Ủy quyền (Delegate)
                          </div>
                          <p className="text-[11px] leading-normal text-muted-foreground/80">Khẩn cấp, Không quan trọng (họp phi lợi ích, email/tin nhắn vặt).</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 space-y-1">
                          <div className="font-semibold text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Q4: Loại bỏ (Eliminate)
                          </div>
                          <p className="text-[11px] leading-normal text-muted-foreground/80">Không khẩn cấp & Không quan trọng (lướt mạng xã hội, giải trí vô bổ).</p>
                        </div>
                      </div> */}
                      
                      <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-primary flex items-center gap-1.5 text-[13px]">
                          Lưu ý khi tạo Task trong MyPACE
                        </h4>
                        <p className="text-muted-foreground pl-1">
                          Khi tạo hoặc sửa một Task, bạn chỉ cần tích chọn hai tùy chọn <span className="text-foreground font-semibold">"Quan trọng"</span> hoặc <span className="text-foreground font-semibold">"Khẩn cấp"</span>. Hệ thống sẽ tự động xếp Task vào vùng Q tương ứng.
                        </p>
                      </div>

                      <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-primary flex items-center gap-1.5 text-[13px]">
                          Cách chọn Task để làm (Quy tắc ưu tiên)
                        </h4>
                        <p className="text-muted-foreground pl-1">
                          Ưu tiên thực hiện các Task theo thứ tự: <span className="text-rose-400 font-bold">Q1 (Làm ngay)</span> &rarr; <span className="text-emerald-400 font-bold">Q2 (Lên lịch)</span> &rarr; <span className="text-amber-400 font-bold">Q3 (Ủy quyền)</span> &rarr; <span className="text-slate-400 font-bold">Q4 (Loại bỏ)</span>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <p className="text-muted-foreground text-center">
                        Bấm nút Đóng hoặc nhấp lại ô vừa chọn để quay lại danh sách:
                      </p>
                      
                      {selectedQ === "Q1" && (
                        <div className="space-y-3 bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl animate-fade-in duration-300 relative text-left">
                          <div className="flex items-center justify-between border-b border-rose-500/10 pb-2">
                            <h4 className="font-bold text-rose-400 flex items-center gap-1.5 text-sm">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                              Vùng Q1: Khẩn Cấp & Quan Trọng (Làm Ngay - Do)
                            </h4>
                            <button 
                              type="button" 
                              onClick={() => setSelectedQ(null)} 
                              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline uppercase bg-rose-500/10 px-1.5 py-0.5 rounded transition-all"
                            >
                              ✕ Đóng
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-muted-foreground text-[11.5px]">
                            <p>
                              <strong>📌 Đặc điểm:</strong> Các công việc bắt buộc phải giải quyết ngay lập tức (sự cố hệ thống, hạn chót báo cáo, khủng hoảng đột xuất). Nếu để quá nhiều việc ở Q1, bạn sẽ luôn rơi vào trạng thái căng thẳng và kiệt sức.
                            </p>
                            <p>
                              <strong>✍️ Cách tạo trong MyPACE:</strong> Khi tạo/sửa Task, tích chọn cả 2 ô <span className="text-rose-400 font-semibold">"Quan trọng"</span> và <span className="text-rose-400 font-semibold">"Khẩn cấp"</span>.
                            </p>
                            <p>
                              <strong>🚀 Cách xử lý & Chọn làm:</strong> Đây là các task có độ ưu tiên cao nhất. Hãy đưa vào Daily Plan để <strong>làm ngay trong ngày</strong> trước các việc khác. Thuật toán Auto-Schedule sẽ xếp các việc này ở khung giờ đầu ngày.
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedQ === "Q2" && (
                        <div className="space-y-3 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl animate-fade-in duration-300 relative text-left">
                          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                              Vùng Q2: Quan Trọng & Không Khẩn Cấp (Lập Kế Hoạch - Plan)
                            </h4>
                            <button 
                              type="button" 
                              onClick={() => setSelectedQ(null)} 
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded transition-all"
                            >
                              ✕ Đóng
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-muted-foreground text-[11.5px]">
                            <p>
                              <strong>📌 Đặc điểm:</strong> Các công việc phục vụ mục tiêu lâu dài, nâng cao kỹ năng (học tập, lập kế hoạch, rèn luyện sức khỏe, xây dựng mối quan hệ). Đây là không gian giúp bạn phát triển bền vững và giảm thiểu tối đa rủi ro phát sinh ở Q1.
                            </p>
                            <p>
                              <strong>✍️ Cách tạo trong MyPACE:</strong> Tích chọn ô <span className="text-emerald-400 font-semibold">"Quan trọng"</span> và để trống ô "Khẩn cấp".
                            </p>
                            <p>
                              <strong>🚀 Cách xử lý & Chọn làm:</strong> Đây là trọng tâm của MyPACE. Hãy chủ động <strong>lên lịch thực hiện đều đặn mỗi ngày</strong>. Thực hiện tốt Q2 giúp bạn chủ động kiểm soát thời gian, không bao giờ bị cuốn vào khủng hoảng.
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedQ === "Q3" && (
                        <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl animate-fade-in duration-300 relative text-left">
                          <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                              Vùng Q3: Khẩn Cấp & Không Quan Trọng (Ủy Quyền - Delegate)
                            </h4>
                            <button 
                              type="button" 
                              onClick={() => setSelectedQ(null)} 
                              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline uppercase bg-amber-500/10 px-1.5 py-0.5 rounded transition-all"
                            >
                              ✕ Đóng
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-muted-foreground text-[11.5px]">
                            <p>
                              <strong>📌 Đặc điểm:</strong> Các công việc cần phản hồi gấp nhưng không giúp bạn đạt mục tiêu dài hạn (email thông báo, các cuộc gọi làm phiền, các cuộc họp vô bổ hoặc việc vặt của người khác).
                            </p>
                            <p>
                              <strong>✍️ Cách tạo trong MyPACE:</strong> Tích chọn ô <span className="text-amber-400 font-semibold">"Khẩn cấp"</span> và để trống ô "Quan trọng".
                            </p>
                            <p>
                              <strong>🚀 Cách xử lý & Chọn làm:</strong> Giải quyết nhanh, từ chối lịch sự, hoặc <strong>ủy quyền / tự động hóa</strong>. Chỉ xếp lịch làm các việc này sau khi đã hoàn thành các việc thuộc Q1 và Q2.
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedQ === "Q4" && (
                        <div className="space-y-3 bg-slate-900 border border-slate-850 p-4 rounded-2xl animate-fade-in duration-300 relative text-left">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h4 className="font-bold text-slate-400 flex items-center gap-1.5 text-sm">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                              Vùng Q4: Không Khẩn Cấp & Không Quan Trọng (Loại Bỏ - Eliminate)
                            </h4>
                            <button 
                              type="button" 
                              onClick={() => setSelectedQ(null)} 
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-300 hover:underline uppercase bg-slate-800 px-1.5 py-0.5 rounded transition-all"
                            >
                              ✕ Đóng
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-muted-foreground text-[11.5px]">
                            <p>
                              <strong>📌 Đặc điểm:</strong> Các hoạt động tiêu tốn thời gian mà không mang lại giá trị thực tế (lướt mạng xã hội vô bổ, chơi game quá giờ, xem tivi thụ động).
                            </p>
                            <p>
                              <strong>✍️ Cách tạo trong MyPACE:</strong> Để trống cả 2 ô "Quan trọng" và "Khẩn cấp".
                            </p>
                            <p>
                              <strong>🚀 Cách xử lý & Chọn làm:</strong> Hạn chế tối đa hoặc <strong>loại bỏ hoàn toàn</strong> khỏi kế hoạch ngày. Chỉ xếp lịch thực hiện khi bạn thực sự cần thời gian nghỉ ngơi thư giãn và đã hoàn thành toàn bộ các đầu việc khác.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-primary/80 italic pl-1 border-t border-slate-800/50 pt-1.5 mt-2">
                    💡 Thuật toán Tự Động Xếp Lịch (Auto-Schedule) của MyPACE sẽ tự động phân bổ quỹ thời gian khả dụng của bạn cho các Task theo thứ tự ưu tiên tuyệt đối: Q1 → Q2 → Q3 → Q4.
                  </div>
                </div>
              )}
            </DialogDescription>
          </div>

          {/* Slide Dot Indicators */}
          <div className="flex gap-1.5 justify-center py-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-row justify-between items-center w-full gap-3 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={cn("h-11 rounded-xl font-medium", currentSlide === 0 && "opacity-0 pointer-events-none")}
          >
            Quay lại
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            className="h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground transition-all active:scale-[0.98]"
          >
            {currentSlide === totalSlides - 1 ? (isHelpMode ? "Đóng" : "Bắt đầu lên kế hoạch") : "Tiếp tục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
