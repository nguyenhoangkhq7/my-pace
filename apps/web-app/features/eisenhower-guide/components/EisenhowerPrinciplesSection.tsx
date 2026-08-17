import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EisenhowerPrinciplesSection() {
  const { t } = useTranslation();
  const guide = t.eisenhowerGuide;

  const PRINCIPLES = [
    {
      num: "01",
      title: guide.principle1Title,
      desc: guide.principle1Desc,
      badge: "60-70% Q2",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      num: "02",
      title: guide.principle2Title,
      desc: guide.principle2Desc,
      badge: "Nói KHÔNG",
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      num: "03",
      title: guide.principle3Title,
      desc: guide.principle3Desc,
      badge: "Cắt bỏ Q4",
      badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      num: "04",
      title: guide.principle4Title,
      desc: guide.principle4Desc,
      badge: "5 phút / Sáng",
      badgeColor: "text-primary bg-primary/10 border-primary/20",
    },
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          {guide.principlesTitle}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {guide.principlesSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PRINCIPLES.map((p, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60 tracking-wider">
                  {p.num}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {p.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">
            Sẵn sàng làm chủ thời gian cùng MyPACE?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Bắt đầu phân loại công việc vào 4 góc phần tư ngay hôm nay để tận hưởng cảm giác tập trung sâu và năng suất bền vững.
          </p>
        </div>
        <div>
          <Button asChild size="default" className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl cursor-pointer">
            <Link href="/" className="inline-flex items-center gap-2">
              <span>{guide.ctaButton}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
