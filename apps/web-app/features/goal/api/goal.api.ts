import { fetchClient } from "@/lib/fetchClient";
import { Goal, GoalCreateRequest, GoalUpdateRequest } from "../types";

export const goalApi = {
  getGoals: () => fetchClient.get<Goal[]>("goals"),
  createGoal: (data: GoalCreateRequest) => fetchClient.post<Goal, GoalCreateRequest>("goals", data),
  updateGoal: (id: string, data: GoalUpdateRequest) => fetchClient.put<Goal, GoalUpdateRequest>(`goals/${id}`, data),
  updateMilestone: (goalId: string, milestoneId: string, isDone: boolean) => fetchClient.put<Goal, { isDone: boolean }>(`goals/${goalId}/milestones/${milestoneId}`, { isDone }),
  deleteGoal: (id: string) => fetchClient.del<unknown>(`goals/${id}`),
};
