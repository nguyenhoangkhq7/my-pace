export function getShortName(fullName?: string): string {
  if (!fullName) return "User";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return parts.slice(-2).join(" ");
}
