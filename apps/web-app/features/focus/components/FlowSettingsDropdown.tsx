"use client";

import { Settings2, RefreshCw, Maximize, Minimize, Headphones } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useTranslation } from "@/hooks/use-translation";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FlowSettingsDropdownProps {
  onResetLayout: () => void;
  onEnterZenFull?: () => void;
}

export function FlowSettingsDropdown({ onResetLayout, onEnterZenFull }: FlowSettingsDropdownProps) {
  const { t } = useTranslation();
  const setIsSettingsOpen = useFocusStore((s) => s.setIsSettingsOpen);
  const isFlowFullscreen = useFocusStore((s) => s.isFlowFullscreen);
  const toggleFlowFullscreen = useFocusStore((s) => s.toggleFlowFullscreen);
  const isXl = useMediaQuery("(min-width: 1280px)");

  const handleToggleFullscreen = () => {
    toggleFlowFullscreen();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground p-2.5 rounded-lg shadow-lg border border-border backdrop-blur transition-all active:scale-95 cursor-pointer"
            title={t.flow.settingsTooltip}
          >
            <Settings2 className="w-4.5 h-4.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border text-foreground shadow-xl min-w-48">
          <DropdownMenuItem
            onClick={handleToggleFullscreen}
            className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-muted-foreground hover:text-foreground"
          >
            {isFlowFullscreen ? (
              <>
                <Minimize className="w-4 h-4 text-muted-foreground" /> {t.flow.exitFullscreen}
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-muted-foreground" /> {t.flow.enterFullscreen}
              </>
            )}
          </DropdownMenuItem>
          {onEnterZenFull && isXl && (
            <DropdownMenuItem
              onClick={onEnterZenFull}
              className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-muted-foreground hover:text-foreground"
            >
              <Headphones className="w-4 h-4 text-muted-foreground" /> Zen Full Mode
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" /> {t.flow.pomodoroConfig}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onResetLayout}
            className="hover:bg-muted focus:bg-muted cursor-pointer flex items-center gap-2 text-xs font-semibold py-2 px-3 text-rose-400 hover:text-rose-300"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" /> {t.flow.resetLayout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
