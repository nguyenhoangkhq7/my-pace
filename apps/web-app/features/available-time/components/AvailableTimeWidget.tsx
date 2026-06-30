import type { AvailableTimeData } from "../types";

interface AvailableTimeWidgetProps {
  data: AvailableTimeData | null;
  isLoading: boolean;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}p`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}p`;
}

export function AvailableTimeWidget({ data, isLoading }: AvailableTimeWidgetProps) {
  const available = data?.availableMinutes ?? 0;
  const working   = data?.workingWindowMinutes ?? 0;
  const blocked   = data?.blockedMinutes ?? 0;
  const bufferPct = data?.bufferPct ?? 20;
  const checkedIn = data?.checkedIn ?? false;
  const checkinTime = data?.checkinTime;

  const fillPct = working > 0 ? Math.min(100, Math.round((available / working) * 100)) : 0;

  const radius       = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset   = circumference - (fillPct / 100) * circumference;

    return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="44" cy="44" r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isLoading ? circumference : dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isLoading ? (
              <span className="text-xs text-muted-foreground animate-pulse">...</span>
            ) : (
              <>
                <span className="text-base font-bold text-foreground leading-none">{fillPct}%</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">còn lại</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Thời gian khả dụng hôm nay
            </p>
            {checkedIn && checkinTime && (
              <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                Đã Check-in lúc {checkinTime}
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-1.5 pt-1">
              <div className="h-7 w-28 rounded-lg bg-muted animate-pulse" />
              <div className="h-3 w-40 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-foreground leading-tight">
                {formatMinutes(available)}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                <Stat label="Bị chiếm"         value={formatMinutes(blocked)} color="text-rose-400" />
                <Stat label="Buffer"            value={`${bufferPct}%`}        color="text-amber-400" />
                <Stat label="Cửa sổ làm việc"  value={formatMinutes(working)} color="text-emerald-400" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {label}: <span className={`font-semibold ${color}`}>{value}</span>
    </span>
  );
}
