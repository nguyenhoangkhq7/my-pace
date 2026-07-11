"use client";

import { Settings2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFocusStore } from "@/features/focus/store/focus.store";

interface FlowSettingsDropdownProps {
  onResetLayout: () => void;
}

export function FlowSettingsDropdown({ onResetLayout }: FlowSettingsDropdownProps) {
  const setIsSettingsOpen = useFocusStore((s) => s.setIsSettingsOpen);

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground p-2.5 rounded-lg shadow-lg border border-border backdrop-blur transition-all active:scale-95 cursor-pointer"
            title="Cài đặt & Giao diện"
          >
            <Settings2 className="w-4.5 h-4.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border text-foreground shadow-xl min-w-44">
          <DropdownMenuItem
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" /> Cấu hình Pomodoro
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onResetLayout}
            className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-rose-400 hover:text-rose-300"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" /> Reset giao diện
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
