export interface Category {
  id: string;
  name: string;
  color: string;
  timeContextId?: string;
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
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
  availabilityStatus?: 'BUSY' | 'FREE';
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
  isReviewed: boolean;
  tasks: DailyPlanTask[];
}

