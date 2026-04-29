import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";

export function TopHeader() {
  return (
    <header className="flex h-16 items-center justify-end border-b border-slate-800 px-8">
      <Button
        aria-label="Notifications"
        variant="ghost"
        size="icon"
        className="mr-4 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 active:scale-95"
      >
        <HugeiconsIcon icon={Notification03Icon} size={16} />
      </Button>
      <Avatar>
        <AvatarFallback>MP</AvatarFallback>
      </Avatar>
    </header>
  );
}

