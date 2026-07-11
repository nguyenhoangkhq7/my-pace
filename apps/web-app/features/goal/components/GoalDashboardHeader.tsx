import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Target02Icon, PlusSignIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";

interface GoalDashboardHeaderProps {
  onOpenRules: () => void;
  onOpenCreate: () => void;
}

export function GoalDashboardHeader({ onOpenRules, onOpenCreate }: GoalDashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <HugeiconsIcon icon={Target02Icon} className="text-primary" size={26} />
          Mục Tiêu
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">Quản lý các mục tiêu dài hạn và theo dõi tiến độ</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onOpenRules} className="text-muted-foreground">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mr-2" />
          Hướng dẫn
        </Button>
        <Button onClick={onOpenCreate} size="lg" className="shadow-lg hover:shadow-primary/25 transition-all">
          <HugeiconsIcon icon={PlusSignIcon} size={18} className="mr-2" />
          New Goal
        </Button>
      </div>
    </div>
  );
}
