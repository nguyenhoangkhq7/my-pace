"use client";

import { useTranslation } from "@/hooks/use-translation";

interface QuickAddSuggestionsProps {
  onSelect: (text: string) => void;
}

/** Color-coded token pill */
function Token({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

export function QuickAddSuggestions({ onSelect }: QuickAddSuggestionsProps) {
  const { t } = useTranslation();

  const taskSuggestions = [
    t.quickAdd.suggestion1,
    t.quickAdd.suggestion2,
    t.quickAdd.suggestion3,
    t.quickAdd.suggestion4,
    t.quickAdd.suggestion5,
    t.quickAdd.suggestion6,
  ];

  const eventSuggestions = [
    t.quickAdd.eventSuggestion1,
    t.quickAdd.eventSuggestion2,
    t.quickAdd.eventSuggestion3,
    t.quickAdd.eventSuggestion4,
  ];

  return (
    <div className="px-4 py-3 space-y-3">
      <p className="text-[11px] leading-snug text-muted-foreground">{t.quickAdd.formulaTip}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <FormulaCard
          title={t.quickAdd.formulaTabTask}
          label={t.quickAdd.formulaLabel}
          patternLabel={t.quickAdd.formulaTaskPattern}
          tokens={[
            [t.quickAdd.tokenAction, "#6366f1"],
            [t.quickAdd.tokenDuration, "#0ea5e9"],
            [t.quickAdd.tokenDueDate, "#f59e0b"],
            [t.quickAdd.tokenUrgency, "#ef4444"],
            [t.quickAdd.tokenCategory, "#8b5cf6"],
            [t.quickAdd.tokenGoal, "#14b8a6"],
            [t.quickAdd.tokenNotes, "#64748b"],
            [t.quickAdd.tokenChecklist, "#22c55e"],
          ]}
          example={[
            [t.quickAdd.exampleAction, "#6366f1"],
            [t.quickAdd.exampleDuration, "#0ea5e9"],
            [t.quickAdd.exampleDueDate, "#f59e0b"],
            [t.quickAdd.exampleUrgency, "#ef4444"],
            [t.quickAdd.exampleCategory, "#8b5cf6"],
            [t.quickAdd.exampleGoal, "#14b8a6"],
            [t.quickAdd.exampleNotes, "#64748b"],
            [t.quickAdd.exampleChecklist, "#22c55e"],
          ]}
          suggestions={taskSuggestions}
          onSelect={onSelect}
        />

        <FormulaCard
          title={t.quickAdd.formulaTabEvent}
          label={t.quickAdd.formulaLabel}
          patternLabel={t.quickAdd.formulaEventPattern}
          tokens={[
            [t.quickAdd.tokenEventName, "#8b5cf6"],
            [t.quickAdd.tokenEventDate, "#f59e0b"],
            [t.quickAdd.tokenEventTime, "#10b981"],
            [t.quickAdd.tokenAllDay, "#0ea5e9"],
            [t.quickAdd.tokenCategory, "#8b5cf6"],
            [t.quickAdd.tokenNotes, "#64748b"],
          ]}
          example={[
            [t.quickAdd.exampleEventName, "#8b5cf6"],
            [t.quickAdd.exampleEventDate, "#f59e0b"],
            [t.quickAdd.exampleEventTime, "#10b981"],
            [t.quickAdd.exampleAllDay, "#0ea5e9"],
            [t.quickAdd.exampleNotes, "#64748b"],
          ]}
          suggestions={eventSuggestions}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

interface FormulaCardProps {
  title: string;
  label: string;
  patternLabel: string;
  tokens: Array<[string, string]>;
  example: Array<[string, string]>;
  suggestions: string[];
  onSelect: (text: string) => void;
}

function FormulaCard({ title, label, patternLabel, tokens, example, suggestions, onSelect }: FormulaCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2.5 shadow-sm">

      {/* Header: type title + AI badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-foreground">{title}</p>
        <span className="text-[10px] font-medium text-primary/70 bg-primary/8 rounded-full px-2 py-0.5">
          {label}
        </span>
      </div>

      {/* Color legend — what each token means */}
      <div className="flex flex-wrap gap-1">
        {tokens.map(([lbl, color], i) => (
          <Token key={`${lbl}-${i}`} label={lbl} color={color} />
        ))}
      </div>

      {/* Example row — same colors, real words */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {patternLabel}
        </p>
        <div className="flex flex-wrap items-baseline gap-1">
          {example.map(([lbl, color], i) => (
            <span
              key={`${lbl}-${i}`}
              className="rounded px-1 py-0.5 text-[12px] font-medium"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {lbl}
            </span>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="pt-0.5 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {title}
        </p>
        <div className="flex flex-col gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-background/80 hover:bg-primary/8 hover:text-primary text-muted-foreground transition-colors cursor-pointer border border-transparent hover:border-primary/15 group"
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
