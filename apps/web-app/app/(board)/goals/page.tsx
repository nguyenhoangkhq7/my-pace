import { GoalDashboard } from "@/features/goal/components/GoalDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goals | MyPACE",
  description: "Manage your long-term goals and milestones.",
};

export default function GoalsPage() {
  return <GoalDashboard />;
}
