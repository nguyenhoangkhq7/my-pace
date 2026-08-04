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

  const day2 = new Date(now);
  day2.setUTCDate(day2.getUTCDate() + 2);
  const day2Date = formatter.format(day2);

  const day3 = new Date(now);
  day3.setUTCDate(day3.getUTCDate() + 3);
  const day3Date = formatter.format(day3);

  return (
    <DashboardPage 
      initialData={{ 
        currentDate, 
        tomorrowDate,
        day2Date,
        day3Date
      }} 
    />
  );
}
