import Link from "next/link";
import { ArrowLeft, Quote, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function EisenhowerHero() {
  const { t } = useTranslation();
  const guide = t.eisenhowerGuide;

  return (
    <div className="space-y-6">
      {/* ── Top Back Button ── */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>{guide.backToBoard}</span>
        </Link>
      </div>

      {/* ── Hero Title Section ── */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{guide.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {guide.heroTitle}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
          {guide.heroSubtitle}
        </p>
      </div>

      {/* ── Famous Quote Callout ── */}
      <div className="relative rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-xs overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-foreground pointer-events-none">
          <Quote className="w-20 h-20" />
        </div>
        <blockquote className="relative z-10 space-y-2">
          <p className="text-base sm:text-lg font-medium text-foreground italic">
            &ldquo;{guide.quote}&rdquo;
          </p>
          <footer className="text-xs text-muted-foreground font-medium">
            — {guide.quoteAuthor}
          </footer>
        </blockquote>
      </div>

      {/* ── Urgent vs Important Distinction ── */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">
          {guide.urgentVsImportantTitle}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {guide.urgentVsImportantDesc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Urgent Card */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="font-bold text-sm text-rose-500 dark:text-rose-400">
                {guide.urgentTitle}
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {guide.urgentTraits.map((trait, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{trait}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Card */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {guide.importantTitle}
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {guide.importantTraits.map((trait, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{trait}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
