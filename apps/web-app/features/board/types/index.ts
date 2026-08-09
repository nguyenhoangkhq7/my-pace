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
  statusWarning?: string;
}

export interface DailyPlanTask {
  id: string;
  dailyPlanId: string;
  task: Task;
  isMit: boolean;
  sortOrder: number;
  escalationReason?: string;
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
