export type GoalType = 'Time-boxed' | 'Milestone' | 'Binary';
export type GoalStatus = 'Freeze' | 'In Progress' | 'Done' | 'Archived';

export interface TimeBoxedGoal {
  targetMinutes: number;
  periodDays: number;
}

export interface Milestone {
  id?: string;
  title: string;
  sortOrder: number;
  isDone: boolean;
  doneAt?: string;
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
  timeBoxedGoal?: TimeBoxedGoal;
  milestones?: Milestone[];
  progressPercentage?: number;
  currentValue?: number;
  targetValue?: number;
}

export interface GoalCreateRequest {
  title: string;
  goalType: GoalType;
  startDate?: string;
  endDate?: string;
  timeBoxedGoal?: TimeBoxedGoal;
  milestones?: Milestone[];
}

export interface GoalUpdateRequest {
  title?: string;
  status?: GoalStatus;
  startDate?: string;
  endDate?: string;
  timeBoxedGoal?: TimeBoxedGoal;
  milestones?: Milestone[];
}
