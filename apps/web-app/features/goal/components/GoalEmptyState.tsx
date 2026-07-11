import { HugeiconsIcon } from "@hugeicons/react";
import { Target02Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

export function GoalEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
      <HugeiconsIcon icon={Target02Icon} size={48} className="mx-auto mb-4 opacity-20" />
      <p>{t.goals.noMatchingGoals}</p>
    </div>
  );
}
