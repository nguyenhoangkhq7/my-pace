"use client";

import { useAvailableTimeQuery } from "@/features/available-time";
import { useTranslation } from "@/hooks/use-translation";

interface StartTimeLabelProps {
  isCollapsed: boolean;
}

export function StartTimeLabel({ isCollapsed }: StartTimeLabelProps) {
  const { t } = useTranslation();

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  
  const { data: availableTime } = useAvailableTimeQuery(today);

  if (isCollapsed || !availableTime?.checkedIn || !availableTime.checkinTime) {
    return null;
  }

  return (
    <div className="px-2 pb-2">
      <span className="text-xs text-muted-foreground block">
        {t.sidebar.todayStartedAt} <span className="font-semibold text-foreground">{availableTime.checkinTime}</span>
      </span>
    </div>
  );
}
