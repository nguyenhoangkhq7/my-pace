"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CalendarPage = dynamic(
  () => import("@/features/calendar/components/CalendarPage").then((mod) => mod.CalendarPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function Page() {
  return <CalendarPage />;
}
