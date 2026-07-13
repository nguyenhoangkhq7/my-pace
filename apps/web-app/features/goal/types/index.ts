export type GoalType = 'Time-boxed' | 'Binary';
export type GoalStatus = 'Freeze' | 'In Progress' | 'Done' | 'Archived';

export interface TimeBoxedGoal {
  durationMinutes: number;
  daysOfWeek: string;
  preferTime?: string;
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
  progressPct?: number;
  autoCreateTask?: boolean;
  durationMinutes?: number;
  daysOfWeek?: string;
  preferTime?: string;
}

export interface GoalCreateRequest {
  title: string;
  goalType: GoalType;
  categoryId: string;
  startDate?: string;
  endDate?: string;
  autoCreateTask?: boolean;
  durationMinutes?: number;
  daysOfWeek?: string;
  preferTime?: string;
}

export interface GoalUpdateRequest {
  title?: string;
  status?: GoalStatus;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  autoCreateTask?: boolean;
  durationMinutes?: number;
  daysOfWeek?: string;
  preferTime?: string;
}
