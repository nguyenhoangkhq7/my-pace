import {GoalDashboard} from "@/features/goal/components/GoalDashboard";
import {getGoalsAction} from "@/features/goal/actions/goal.action";
import {Metadata} from "next";
import {Goal} from "@/features/goal/types";

export const metadata: Metadata = {
  title: "Goals | MyPACE",
  description: "Manage your long-term goals and milestones.",
};

export default async function GoalsPage() {
  let initialGoals: Goal[] = [];
  try {
    initialGoals = await getGoalsAction();
  } catch (error) {
    console.error("Failed to fetch goals on server:", error);
  }

  return <GoalDashboard initialGoals={initialGoals} />;
}
