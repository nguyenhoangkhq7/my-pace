import { useState, useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { Button } from "@/components/ui/button";
import { Settings2, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";

export function PomodoroSettingsModal() {
  const { t } = useTranslation();
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    focusMinutes, 
    breakMinutes, 
    soundEnabled, 
    updateConfig 
  } = useFocusStore();

  const [tempFocus, setTempFocus] = useState(focusMinutes.toString());
  const [tempBreak, setTempBreak] = useState(breakMinutes.toString());
  const [tempSound, setTempSound] = useState(soundEnabled);

  useEffect(() => {
    if (isSettingsOpen) {
      Promise.resolve().then(() => {
        setTempFocus(focusMinutes.toString());
        setTempBreak(breakMinutes.toString());
        setTempSound(soundEnabled);
      });
    }
  }, [isSettingsOpen, focusMinutes, breakMinutes, soundEnabled]);

  const handleSaveSettings = () => {
    const f = parseInt(tempFocus, 10);
    const b = parseInt(tempBreak, 10);
    if (!isNaN(f) && !isNaN(b) && f > 0 && b > 0) {
      updateConfig(f, b, tempSound);
      setIsSettingsOpen(false);
    }
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="sm:max-w-xs bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> {t.flow.pomodoroConfig}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.flow.pomodoroConfigDesc}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.flow.focusDurationLabel}</label>
            <Input 
              type="number" 
              min="1"
              max="120"
              value={tempFocus}
              onChange={(e) => setTempFocus(e.target.value)}
              className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.flow.restDurationLabel}</label>
            <Input 
              type="number" 
              min="1"
              max="60"
              value={tempBreak}
              onChange={(e) => setTempBreak(e.target.value)}
              className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {tempSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {t.flow.notificationSoundLabel}
            </label>
            <Checkbox 
              checked={tempSound}
              onCheckedChange={(checked) => setTempSound(!!checked)}
              className="border-muted-foreground data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-border hover:bg-muted text-muted-foreground" onClick={() => setIsSettingsOpen(false)}>
            {t.common.cancel}
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleSaveSettings}>
            {t.flow.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
