import { User, Sliders, Palette, Clock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

export type SettingsTab = "account" | "general" | "appearance" | "time-contexts" | "support";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
}

export function SettingsSidebar({ activeTab, onSelectTab }: SettingsSidebarProps) {
  const { t } = useTranslation();

  const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "account", label: t.sidebar.account || "Account", icon: User },
    { id: "general", label: t.sidebar.general || "General", icon: Sliders },
    { id: "appearance", label: t.sidebar.theme || "Appearance", icon: Palette },
    { id: "time-contexts", label: t.timeContext.title || "Time Contexts", icon: Clock },
    { id: "support", label: t.sidebar.support || "Support", icon: HelpCircle },
  ];

  return (
    <aside className="w-56 bg-muted/20 border-r border-border/40 p-3 flex flex-col shrink-0 select-none">
      <div className="px-3 py-2.5 mb-2">
        <h2 className="text-sm font-bold tracking-tight text-foreground/90 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t.sidebar.settings}
        </h2>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
