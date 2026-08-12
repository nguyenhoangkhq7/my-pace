import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface GoalDashboardHeaderProps {
  onOpenRules: () => void;
  onOpenCreate: () => void;
}

export function GoalDashboardHeader({ onOpenRules, onOpenCreate }: GoalDashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {t.goals.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">{t.goals.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onOpenRules} className="text-muted-foreground">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mr-2" />
          {t.goals.instructions}
        </Button>
        <Button onClick={onOpenCreate} size="lg" className="shadow-lg hover:shadow-primary/25 transition-all">
          <HugeiconsIcon icon={PlusSignIcon} size={18} className="mr-2" />
          {t.goals.newGoal}
        </Button>
      </div>
    </div>
  );
}
