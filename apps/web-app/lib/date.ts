export function getTodayStr(timezone: string = "Asia/Ho_Chi_Minh"): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function getTomorrowStr(timezone: string = "Asia/Ho_Chi_Minh"): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return formatter.format(tomorrow);
}

export function getNowInTimezone(timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const map = new Map(parts.map(p => [p.type, p.value]));
  
  const year = parseInt(map.get("year")!, 10);
  const month = parseInt(map.get("month")!, 10) - 1; // 0-indexed month
  const day = parseInt(map.get("day")!, 10);
  const hour = parseInt(map.get("hour")!, 10);
  const minute = parseInt(map.get("minute")!, 10);
  const second = parseInt(map.get("second")!, 10);
  
  return new Date(year, month, day, hour, minute, second);
}

export function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
