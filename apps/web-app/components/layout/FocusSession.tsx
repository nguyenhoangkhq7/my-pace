import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";

export function FocusSession() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-pace-muted">Focus Session</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xl font-semibold text-slate-100">45:00</span>
        <Button
          aria-label="Start focus session"
          className="h-9 w-9 rounded-full bg-pace-accent p-0 text-[#0b1930] transition hover:brightness-110 active:scale-95"
        >
          <HugeiconsIcon icon={PlayIcon} size={16} />
        </Button>
      </div>
    </div>
  );
}

