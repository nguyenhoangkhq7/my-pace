"use client";

import { useTranslation } from "@/hooks/use-translation";

interface QuickAddSuggestionsProps {
  onSelect: (text: string) => void;
}

/** Color-coded token in the formula anatomy row */
function Token({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

export function QuickAddSuggestions({ onSelect }: QuickAddSuggestionsProps) {
  const { t } = useTranslation();

  const suggestions = [
    t.quickAdd.suggestion1,
    t.quickAdd.suggestion2,
    t.quickAdd.suggestion3,
    t.quickAdd.suggestion4,
  ];

  return (
    <div className="px-4 py-3 space-y-3">
      {/* ── Formula anatomy ── */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {t.quickAdd.formulaLabel}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <Token label={t.quickAdd.tokenAction}   color="#6366f1" />
          <span className="text-muted-foreground/40">+</span>
          <Token label={t.quickAdd.tokenDuration}  color="#0ea5e9" />
          <span className="text-muted-foreground/40">+</span>
          <Token label={t.quickAdd.tokenTime}      color="#f59e0b" />
          <span className="text-muted-foreground/40">+</span>
          <Token label={t.quickAdd.tokenUrgency}   color="#ef4444" />
        </div>

        {/* Annotated example */}
        <div className="flex flex-wrap items-baseline gap-1 text-[12px] leading-relaxed">
          <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: "#6366f118", color: "#6366f1" }}>
            {t.quickAdd.exampleAction}
          </span>
          <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: "#0ea5e918", color: "#0ea5e9" }}>
            {t.quickAdd.exampleDuration}
          </span>
          <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: "#f59e0b18", color: "#f59e0b" }}>
            {t.quickAdd.exampleTime}
          </span>
          <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: "#ef444418", color: "#ef4444" }}>
            {t.quickAdd.exampleUrgency}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-border/50" />

      {/* ── Clickable examples ── */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {t.quickAdd.tryThese}
        </p>
        <div className="flex flex-col gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-primary/8 hover:text-primary text-muted-foreground transition-colors cursor-pointer border border-transparent hover:border-primary/15 group"
            >
              <span className="mr-1.5 text-muted-foreground/40 group-hover:text-primary/40">↗</span>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
