import { useState } from "react";
import { cn } from "@/lib/utils";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function SlideEisenhower() {
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
      </div>

      <div className="space-y-2 px-1 w-full">
        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
          Ma trận Eisenhower
        </DialogTitle>
        <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground">
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
                    <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Tích cả <span className="text-rose-400 font-semibold">&quot;Quan trọng&quot;</span> và <span className="text-rose-400 font-semibold">&quot;Khẩn cấp&quot;</span> khi tạo task. Auto-Schedule sẽ xếp Q1 vào <strong>đầu tiên</strong> trong ngày.</p>
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
                    <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Chỉ tích <span className="text-emerald-400 font-semibold">&quot;Quan trọng&quot;</span> (bỏ trống &quot;Khẩn cấp&quot;). Làm Q2 đều đặn giúp bạn <strong>không bao giờ rơi vào khủng hoảng Q1</strong>.</p>
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
                    <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">✍️ Trong MyPACE:</strong> Chỉ tích <span className="text-amber-400 font-semibold">&quot;Khẩn cấp&quot;</span> (bỏ trống &quot;Quan trọng&quot;). Hãy ủy quyền hoặc giải quyết thật nhanh — <strong>đừng để Q3 ăn vào thời gian Q2</strong>.</p>
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
        </DialogDescription>
      </div>
    </>
  );
}
