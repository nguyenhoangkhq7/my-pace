import { DashboardPage } from "@/features/board/components/DashboardPage";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board | MyPACE",
  description: "Plan your day and execute your tasks.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get("timezone")?.value || "Asia/Ho_Chi_Minh";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const now = new Date();
  const currentDate = formatter.format(now);
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = formatter.format(tomorrow);

  return (
    <DashboardPage 
      initialData={{ 
        currentDate, 
        tomorrowDate,
      }} 
    />
  );
}
