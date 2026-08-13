import { useTranslation } from "@/hooks/use-translation";

export function StatsLoadingState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center text-slate-400">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p>{t.common.loading}</p>
      </div>
    </div>
  );
}
