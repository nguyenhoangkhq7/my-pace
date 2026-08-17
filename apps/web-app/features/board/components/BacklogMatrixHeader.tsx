import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, FilterIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";
import { Category } from "../types";

interface BacklogMatrixHeaderProps {
  categories: Category[];
  selectedFilterId: string | null;
  setFilter: (id: string | null) => void;
  onNewTask: () => void;
}

export function BacklogMatrixHeader({ categories, selectedFilterId, setFilter, onNewTask }: BacklogMatrixHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-foreground">
          {t.eisenhower.matrixName}
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/eisenhower"
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted/80 hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all duration-200 text-xs font-semibold hover:scale-105 active:scale-95 border border-border/50 hover:border-primary/30"
              aria-label={t.eisenhower.learnMore}
            >
              ?
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>{t.eisenhower.learnMore}</span>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex space-x-2">
        <Select 
          value={selectedFilterId || "none"} 
          onValueChange={(val) => setFilter(val === "none" ? null : val)}
        >
          <SelectTrigger className="!h-8 border-border bg-card text-foreground w-[180px] cursor-pointer">
            <div className="flex items-center">
              <HugeiconsIcon icon={FilterIcon} size={16} className="mr-2" />
              <SelectValue placeholder={t.common.filter} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="none">{t.common.allTasks}</SelectItem>
            <SelectItem value="goal">{t.taskForm.goalLabel}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 bg-primary hover:bg-primary/90 text-white cursor-pointer tour-new-task-btn"
          onClick={onNewTask}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
          {t.board.newTask}
        </Button>
      </div>
    </div>
  );
}
