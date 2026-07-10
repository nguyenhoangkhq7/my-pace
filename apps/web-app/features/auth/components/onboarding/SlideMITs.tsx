import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SlideMITsProps {
  isHelpMode?: boolean;
}

export function SlideMITs({ isHelpMode }: SlideMITsProps) {
  return (
    <>
      <div className="w-full flex items-center justify-center" style={{ minHeight: "10rem" }}>
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
      </div>

      <div className="space-y-2 px-1 w-full">
        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
          Triết lý MITs
        </DialogTitle>
        <DialogDescription asChild className="text-sm leading-relaxed text-muted-foreground">
          <div className="text-sm text-center">
            {isHelpMode ? (
              <><strong className="text-foreground">Triết lý MITs</strong> giúp loại bỏ sự phân tâm. Giới hạn 1–3 việc quan trọng nhất mỗi ngày để đảm bảo năng lượng tập trung vào mục tiêu tạo tác động lớn nhất.</>
            ) : (
              <>Thay vì gồng gánh danh sách dài, mỗi ngày chỉ cam kết hoàn thành <span className="text-foreground font-semibold">1–3 việc thực sự quan trọng (MITs)</span> trước. Điều này bảo vệ tiêu điểm và duy trì động lực.</>
            )}
          </div>
        </DialogDescription>
      </div>
    </>
  );
}
