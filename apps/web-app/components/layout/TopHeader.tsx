import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TopHeader() {
  return (
    <header className="flex h-16 items-center justify-end border-b border-white/5 px-8">
      <button
        aria-label="Notifications"
        className="mr-4 rounded-full border border-white/10 bg-[var(--pace-panel)] p-2 text-slate-300"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 22a2.4 2.4 0 0 0 2.4-2.4h-4.8A2.4 2.4 0 0 0 12 22Zm7.2-6V11a7.2 7.2 0 1 0-14.4 0v5l-2.4 2.4v1.2h21.6v-1.2L19.2 16Z" />
        </svg>
      </button>
      <Avatar>
        <AvatarFallback>MP</AvatarFallback>
      </Avatar>
    </header>
  );
}

