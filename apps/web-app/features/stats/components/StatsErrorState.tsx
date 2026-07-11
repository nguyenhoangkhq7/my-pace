import { AlertCircle } from "lucide-react";

interface StatsErrorStateProps {
  error: string;
}

export function StatsErrorState({ error }: StatsErrorStateProps) {
  return (
    <div className="flex h-full items-center justify-center text-rose-400">
      <div className="flex items-center gap-2 bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    </div>
  );
}
