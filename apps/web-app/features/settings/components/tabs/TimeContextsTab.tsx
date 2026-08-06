import { TimeContextList } from "@/features/time-context";
import { useTranslation } from "@/hooks/use-translation";

export function TimeContextsTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t.timeContext.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.settingsModal.timeContextsDesc}
        </p>
      </div>

      <div className="pt-2">
        <TimeContextList />
      </div>
    </div>
  );
}
