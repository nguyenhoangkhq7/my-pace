import { DashboardPage } from "@/features/board/components/DashboardPage";
import { getTasksAction } from "@/features/board/actions/task.action";
import { getCategoriesAction } from "@/features/board/actions/category.action";
import { getDailyPlanAction } from "@/features/board/actions/plan.action";
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

  const [tasks, categories, dailyPlanToday, dailyPlanTomorrow] = await Promise.all([
    getTasksAction().catch((err) => { console.error(err); return []; }),
    getCategoriesAction().catch((err) => { console.error(err); return []; }),
    getDailyPlanAction(currentDate).catch((err) => { console.error(err); return null; }),
    getDailyPlanAction(tomorrowDate).catch((err) => { console.error(err); return null; }),
  ]);

  return (
    <DashboardPage 
      initialData={{ 
        tasks, 
        categories, 
        dailyPlanToday, 
        dailyPlanTomorrow, 
        currentDate, 
        tomorrowDate,
        day2Date,
        day3Date
      }} 
    />
  );
}
