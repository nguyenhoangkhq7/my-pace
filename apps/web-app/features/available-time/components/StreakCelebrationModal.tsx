import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAvailableTimeStore } from "../store/available-time.store";
import { useTranslation } from "@/hooks/use-translation";

export function StreakCelebrationModal() {
  const { t } = useTranslation();
  const streakToCelebrate = useAvailableTimeStore((s) => s.streakToCelebrate);
  const setStreakToCelebrate = useAvailableTimeStore((s) => s.setStreakToCelebrate);

  if (streakToCelebrate === null) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setStreakToCelebrate(null)}>
      <DialogContent className="bg-slate-950 text-slate-50 border-slate-800 sm:max-w-[420px] p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6 overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <DialogHeader className="flex flex-col items-center gap-2 relative z-10">
          {/* Flame Icon Container */}
          <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-slate-900/60 border border-slate-800 shadow-inner group">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-orange-500/5 animate-ping duration-1000"></div>
            
            {/* SVG Flame */}
            <svg 
              className="w-20 h-20 text-orange-500 animate-[bounce_1.5s_infinite] drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2C12 2 17 6.5 17 11.5C17 14.5376 14.7614 17 12 17C9.23858 17 7 14.5376 7 11.5C7 6.5 12 2 12 2Z" 
                fill="url(#flameGradient)" 
              />
              <path 
                d="M12 6.5C12 6.5 14.5 9 14.5 11.5C14.5 12.8807 13.3807 14 12 14C10.6193 14 9.5 12.8807 9.5 11.5C9.5 9 12 6.5 12 6.5Z" 
                fill="url(#innerFlameGradient)" 
              />
              <defs>
                <linearGradient id="flameGradient" x1="12" y1="2" x2="12" y2="17" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF8A00" />
                  <stop offset="1" stopColor="#E52E71" />
                </linearGradient>
                <linearGradient id="innerFlameGradient" x1="12" y1="6.5" x2="12" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFD600" />
                  <stop offset="1" stopColor="#FF8A00" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Small Streak Count Badge overlay */}
            <div className="absolute -bottom-1 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs font-black px-3 py-0.5 rounded-full border border-slate-950 shadow-md">
              {t.streak.days(streakToCelebrate)}
            </div>
          </div>

          <DialogTitle className="text-2xl font-black tracking-tight text-slate-100 mt-4">
            {t.streak.title(streakToCelebrate)}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed max-w-sm pt-2">
            {t.streak.description(streakToCelebrate)}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="w-full relative z-10">
          <Button 
            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-bold h-11 rounded-2xl shadow-lg shadow-orange-500/25 border-none cursor-pointer text-sm"
            onClick={() => setStreakToCelebrate(null)}
          >
            {t.streak.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
