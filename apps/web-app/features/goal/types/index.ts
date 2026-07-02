export type GoalType = 'Time-boxed' | 'Milestone' | 'Binary';
export type GoalStatus = 'Freeze' | 'In Progress' | 'Done' | 'Archived';

export interface TimeBoxedGoal {
  targetMinutes: number;
  periodDays: number;
  accumulatedMinutes?: number;
}

export interface MilestoneGoal {
  targetCount: number;
  currentCount?: number;
}

export interface Goal {
  id: string;
  title: string;
  goalType: GoalType;
  status: GoalStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  parentGoalId?: string;
  timeBoxedGoal?: TimeBoxedGoal;
  milestoneGoal?: MilestoneGoal;
  progressPct?: number;
}

export interface GoalCreateRequest {
  title: string;
  goalType: GoalType;
  categoryId: string;
  parentGoalId?: string;
  startDate?: string;
  endDate?: string;
  timeBoxedGoal?: TimeBoxedGoal;
  milestoneGoal?: MilestoneGoal;
}

export interface GoalUpdateRequest {
  title?: string;
  status?: GoalStatus;
  categoryId?: string;
  parentGoalId?: string;
  startDate?: string;
  endDate?: string;
  timeBoxedGoal?: TimeBoxedGoal;
  milestoneGoal?: MilestoneGoal;
}
