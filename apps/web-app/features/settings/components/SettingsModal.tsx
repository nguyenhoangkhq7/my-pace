import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SettingsSidebar, type SettingsTab } from "./SettingsSidebar";
import { AccountTab } from "./tabs/AccountTab";
import { GeneralTab } from "./tabs/GeneralTab";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { TimeContextsTab } from "./tabs/TimeContextsTab";
import { SupportTab } from "./tabs/SupportTab";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile: () => void;
  onOpenPhilosophy: () => void;
  onOpenFeedback: () => void;
}

export function SettingsModal({
  isOpen,
  onOpenChange,
  onOpenProfile,
  onOpenPhilosophy,
  onOpenFeedback,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const handleOpenProfile = () => {
    onOpenChange(false);
    onOpenProfile();
  };

  const handleOpenPhilosophy = () => {
    onOpenChange(false);
    onOpenPhilosophy();
  };

  const handleOpenFeedback = () => {
    onOpenChange(false);
    onOpenFeedback();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[520px] p-0 gap-0 overflow-hidden flex flex-row rounded-2xl border border-border/50 shadow-2xl bg-popover/95 backdrop-blur-md">
        <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 p-6 overflow-y-auto min-h-0 bg-background/40 scrollbar-thin">
          {activeTab === "account" && <AccountTab onOpenProfile={handleOpenProfile} />}
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "time-contexts" && <TimeContextsTab />}
          {activeTab === "support" && (
            <SupportTab
              onOpenPhilosophy={handleOpenPhilosophy}
              onOpenFeedback={handleOpenFeedback}
            />
          )}
        </main>
      </DialogContent>
    </Dialog>
  );
}
