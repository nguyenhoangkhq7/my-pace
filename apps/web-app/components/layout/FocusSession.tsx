import { Button } from "@/components/ui/button";

export function FocusSession() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--pace-panel)] p-4">
      <p className="text-xs text-pace-muted">Focus Session</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xl font-semibold">45:00</span>
        <Button
          aria-label="Start focus session"
          className="h-9 w-9 rounded-full bg-pace-accent p-0 text-[#0b1930]"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

