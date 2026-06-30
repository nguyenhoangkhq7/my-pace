export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  userId: string;
  goalId?: string;
  categoryId?: string;
  category?: Category;
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  isUrgent: boolean;
  isImportant: boolean;
  status: 'Backlog' | 'Picked for Today' | 'Done';
  dueDate?: string;
  notes?: string;
}

export interface TaskTimeBlock {
  id: string;
  taskId: string;
  dailyPlanId: string;
  startTime: string; // ISO datetime string
  endTime: string;
  partIndex: number;
  totalParts: number;
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
  tasks: DailyPlanTask[];
  timeBlocks: TaskTimeBlock[];
}

