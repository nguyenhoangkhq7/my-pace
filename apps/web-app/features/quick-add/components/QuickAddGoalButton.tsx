"use client";

import { useState } from "react";
import { Target, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGoals } from "@/features/board/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddGoalButtonProps {
  goalId: string | null;
  onChange: (goalId: string | null) => void;
}

export function QuickAddGoalButton({ goalId, onChange }: QuickAddGoalButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { goals } = useGoals();

  const activeGoal = goals.find((g) => g.id === goalId);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={activeGoal ? `${t.sunsamaForm.goal}: ${activeGoal.title}` : t.sunsamaForm.linkGoal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            activeGoal
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Target className="h-3.5 w-3.5 opacity-80" />
          {activeGoal && <span className="truncate max-w-[90px]">{activeGoal.title}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5 space-y-1 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
          {t.sunsamaForm.linkGoal}
        </p>
        <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-7 text-xs font-normal"
            onClick={() => handleSelect(null)}
          >
            <span className="text-muted-foreground">{t.sunsamaForm.noGoal}</span>
            {!goalId && <Check className="h-3.5 w-3.5 text-primary" />}
          </Button>
          {goals.map((g) => (
            <Button
              key={g.id}
              variant="ghost"
              size="sm"
              className="w-full justify-between h-7 text-xs font-normal"
              onClick={() => handleSelect(g.id)}
            >
              <span className="truncate">{g.title}</span>
              {goalId === g.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
