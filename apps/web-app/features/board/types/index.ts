export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  timeContextId?: string;
  isDefault?: boolean;
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  userId: string;
  goalId?: string;
  categoryId?: string;
  category?: Category;
  title: string;
  taskType: 'AD_HOC' | 'GOAL_SESSION';
  estimatedMinutes: number;
  actualMinutes: number;
  isUrgent: boolean;
  isImportant: boolean;
  status: 'Icebox' | 'Backlog' | 'Picked for Today' | 'Done';
  dueDate?: string;
  notes?: string;
  isSplittable?: boolean;
  minChunkMinutes?: number;
  maxDailyDuration?: number;
  checklists?: TaskChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeLog {
  id: string;
  timeBlockId: string;
  taskId: string;
  loggedMinutes: number;
  startedAt: string;
  endedAt: string;
  createdAt?: string;
}

export interface TaskTimeBlock {
  id: string;
  taskId: string;
  startTime: string; // ISO datetime string
  endTime: string;
  partIndex: number;
  totalParts: number;
  dailyPlanId?: string;
  isMit?: boolean;
  availabilityStatus?: 'BUSY' | 'FREE';
  isLocked?: boolean;
  createdAt?: string;
  // TimeLog tracking
  timeLogs: TimeLog[];
  totalLoggedMinutes: number;
  hasTimeLogs: boolean;
}

export interface DailyPlanTask {
  id: string;
  dailyPlanId: string;
  task: Task;
  isMit: boolean;
  sortOrder: number;
}

export interface DailyPlan {
  id: string;
  userId: string;
  planDate: string;
  availableMinutes: number;
  isConfirmed: boolean;
  isReviewed?: boolean;
  confirmedAt?: string;
  tasks: DailyPlanTask[];
  timeBlocks: TaskTimeBlock[];
}

export interface DailyPlanSummary {
  planDate: string;
  isConfirmed: boolean;
  totalTasks: number;
  completedTasks: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
}

export interface BriefingAlert {
  type: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'GOAL_BEHIND' | 'OVERLOADED' | string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  count: number;
  goalTitle?: string | null;
}

export interface GoalProgression {
  goalId: string;
  goalTitle: string;
  currentPct: number;
  projectedPct: number;
  todayTaskCount: number;
  endDate?: string | null;
  daysRemaining: number;
}

export interface BriefingTaskItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  totalEstimatedMinutes?: number;
  isUrgent: boolean;
  isImportant: boolean;
  categoryName?: string | null;
  categoryColor?: string | null;
  goalTitle?: string | null;
  dueDate?: string | null;
  isMit: boolean;
  taskType: string;
  isSplittable?: boolean;
  maxDailyDuration?: number | null;
  fitsToday?: boolean;
}

export interface DailyBriefingResponse {
  date: string;
  availableMinutes: number;
  scheduledMinutes: number;
  fillPercentage: number;
  taskCount: number;
  mitCount: number;
  habitSessionCount: number;
  tasks: BriefingTaskItem[];
  alerts: BriefingAlert[];
  currentStreak: number;
  goalProgressions: GoalProgression[];
  willClearAllOverdue: boolean;
}


